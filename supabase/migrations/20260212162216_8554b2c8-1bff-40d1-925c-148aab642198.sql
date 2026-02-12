
-- Add book_number and unit_number columns to tests table for vocabulary/grammar organization
ALTER TABLE public.tests ADD COLUMN book_number integer;
ALTER TABLE public.tests ADD COLUMN unit_number integer;

-- Add index for efficient querying
CREATE INDEX idx_tests_book_unit ON public.tests (skill, book_number, unit_number);
