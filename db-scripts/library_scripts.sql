-- Adding book
CREATE OR REPLACE PROCEDURE add_book_sp (
  p_title IN books.title%TYPE,
  p_author IN books.author%TYPE,
  p_genre IN books.genre%TYPE,
  p_isbn IN books.isbn%TYPE,
  p_pub_year IN books.pub_year%TYPE
) AS
BEGIN
  INSERT INTO books (title, author, genre, isbn, pub_year, available)
  VALUES (p_title, p_author, p_genre, p_isbn, p_pub_year, 1);
  COMMIT;
END;

-- Updating Books
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

-- Deleteing Books 

CREATE OR REPLACE PROCEDURE delete_book_sp (
  p_isbn IN books.isbn%TYPE
) AS
BEGIN 
  DELETE FROM books WHERE isbn = p_isbn;
  COMMIT;
END;


-- Registering Patrons
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

-- Updating Patron
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

-- Deleting Patron 
CREATE OR REPLACE PROCEDURE delete_patron_sp(
  p_id in patrons.id%TYP
) AS
BEGIN
  DELETE FROM books where isbn=p_isbn;
  COMMIT
END;

-- Loaning book
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

-- Returning book
CREATE OR REPLACE PROCEDURE return_book_sp (
  p_book_id IN loans.book_id%TYPE
) AS
BEGIN
  UPDATE loans SET return_date = SYSDATE WHERE book_id = p_book_id AND return_date IS NULL;
  UPDATE books SET available = 1 WHERE book_id = p_book_id;
  COMMIT;
END;
