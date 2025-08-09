-- ADD BOOK PROCEDURE
CREATE OR REPLACE PROCEDURE add_book_sp (
  p_title IN lms_books.title%TYPE,
  p_author IN lms_books.author%TYPE,
  p_genre IN lms_books.genre%TYPE,
  p_isbn IN lms_books.isbn%TYPE,
  p_pub_year IN lms_books.pub_year%TYPE
) AS
BEGIN
  INSERT INTO lms_books (title, author, genre, isbn, pub_year,)
  VALUES (p_title, p_author, p_genre, p_isbn, p_pub_year);
  COMMIT;
END;

-- UPDATE BOOK PROCEDURE
CREATE OR REPLACE PROCEDURE update_book_sp (
  p_isbn IN books.isbn%TYPE,
  p_title IN books.title%TYPE,
  p_author IN books.author%TYPE,
  p_genre IN books.genre%TYPE,
  p_pub_year IN books.pub_year%TYPE
) AS
BEGIN
  UPDATE books
  SET title = p_title,
      author = p_author,
      genre = p_genre,
      pub_year = p_pub_year
  WHERE isbn = p_isbn;
  COMMIT;
END;

-- DELETE BOOK PROCEDURE
CREATE OR REPLACE PROCEDURE delete_book_sp (
  p_isbn IN books.isbn%TYPE
) AS
BEGIN 
  DELETE FROM books WHERE isbn = p_isbn;
  COMMIT;
END;


-- LOAN BOOK PROCEDURE
CREATE OR REPLACE PROCEDURE loan_book_sp (
  p_book_id IN loans.book_id%TYPE,
  p_patron_id IN loans.patron_id%TYPE,
  p_loan_date IN loans.loan_date%TYPE,
  p_due_date IN loans.due_date%TYPE
) AS
  v_available NUMBER;
BEGIN
  SELECT available INTO v_available FROM books WHERE book_id = p_book_id;
  
  IF v_available = 1 THEN
    INSERT INTO loans (book_id, patron_id, loan_date, due_date)
    VALUES (p_book_id, p_patron_id, p_loan_date, p_due_date);
    
    UPDATE books SET available = 0 WHERE book_id = p_book_id;
    COMMIT;
  ELSE
    RAISE_APPLICATION_ERROR(-20001, 'Book is already loaned.');
  END IF;
END;

-- SEARCH BOOKS PROCEDURE
CREATE OR REPLACE PROCEDURE search_books_sp (
  p_title   IN  books.title%TYPE DEFAULT NULL,
  p_author  IN  books.author%TYPE DEFAULT NULL,
  p_genre   IN  books.genre%TYPE DEFAULT NULL,
  p_result  OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_result FOR
    SELECT * FROM books
    WHERE (p_title IS NULL OR LOWER(title) LIKE '%' || LOWER(p_title) || '%')
      AND (p_author IS NULL OR LOWER(author) LIKE '%' || LOWER(p_author) || '%')
      AND (p_genre IS NULL OR LOWER(genre) LIKE '%' || LOWER(p_genre) || '%');

EXCEPTION
  WHEN OTHERS THEN
    -- Optionally log the error into activity_log table if needed
    DBMS_OUTPUT.PUT_LINE('Error in search_books_sp: ' || SQLERRM);
    RAISE_APPLICATION_ERROR(-20002, 'An unexpected error occurred while searching books.');
END;
/
-- RETURN BOOK PROCEDURE
CREATE OR REPLACE PROCEDURE return_book_sp (
  p_book_id IN loans.book_id%TYPE
) AS
  v_count NUMBER;
BEGIN
  -- Check if the book is currently loaned (i.e., return_date is still NULL)
  SELECT COUNT(*) INTO v_count
  FROM loans
  WHERE book_id = p_book_id AND return_date IS NULL;

  IF v_count = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Book was not taken out or already returned.');
  END IF;

  -- Proceed with return
  UPDATE loans
  SET return_date = SYSDATE, status = 'RETURNED'
  WHERE book_id = p_book_id AND return_date IS NULL;

  UPDATE books
  SET available = 1
  WHERE isbn = p_book_id;

  COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error in return_book_sp: ' || SQLERRM);
    RAISE_APPLICATION_ERROR(-20002, 'An unexpected error occurred while returning the book.');
END;
/




-------PATRONS ---------------

-- REGISTER PATRON
CREATE OR REPLACE PROCEDURE add_patron_sp (
  p_name IN patrons.name%TYPE,
  p_address IN patrons.address%TYPE,
  p_phone IN patrons.phone%TYPE,
  p_membership_no IN patrons.membership_no%TYPE
) AS
BEGIN
  INSERT INTO patrons (name, address, phone, membership_no)
  VALUES (p_name, p_address, p_phone, p_membership_no);
  COMMIT;
END;

-- UPDATE PATRON
CREATE OR REPLACE PROCEDURE update_patron_sp (
  p_id IN patrons.id%TYPE,
  p_address IN patrons.address%TYPE,
  p_phone IN patrons.phone%TYPE,
  p_email IN patrons.email%TYPE
) AS
BEGIN
  UPDATE patrons
  SET address = p_address,
      phone = p_phone,
      email = p_email
  WHERE id = p_id;
  COMMIT;
END;

-- DELETE PATRON
CREATE OR REPLACE PROCEDURE delete_patron_sp (
  p_id      IN patrons.id%TYPE,
  p_confirm IN CHAR
) AS
BEGIN
  IF UPPER(p_confirm) != 'Y' THEN
    RAISE_APPLICATION_ERROR(-20001, 'Deletion not confirmed. Patron was not deleted.');
  END IF;

  DELETE FROM patrons WHERE id = p_id;

  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20002, 'No patron found with the provided ID.');
  END IF;

  COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error deleting patron: ' || SQLERRM);
    RAISE_APPLICATION_ERROR(-20003, 'Unexpected error occurred while deleting patron.');
END;
/



-- LOGIN PROCEDURE -- 
CREATE OR REPLACE PROCEDURE get_user_by_username_sp(
  p_username IN users.username%TYPE,
  p_result OUT SYS_REFCURSOR
) AS 
BEGIN
  OPEN p_result FOR
    SELECT id, username, password, role
    FROM users
    WHERE usersname = p_username;
END;
/