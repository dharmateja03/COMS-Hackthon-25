-- Migration: Add standard_course_code column to courses table
-- This enables sharing of course embeddings across students taking the same standardized course
-- Date: 2025-11-02

-- Add the new column (nullable since existing courses won't have this value)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS standard_course_code VARCHAR;

-- Create an index for faster lookups when querying by standard course code
CREATE INDEX IF NOT EXISTS idx_courses_standard_course_code ON courses(standard_course_code);

-- Add a comment to the column
COMMENT ON COLUMN courses.standard_course_code IS 'Standard course code (e.g., CSCI-335) for shared embeddings across students';
