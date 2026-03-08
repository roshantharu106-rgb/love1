-- SQL for Supabase Integration
-- This script creates the necessary tables for the Institutional Management System.

-- 1. Generic entries table (used for flexible data storage like settings, notices, etc.)
-- The ID is formatted as '{year}_{key}' to ensure unique entries per category per year.
CREATE TABLE IF NOT EXISTS public.app_entries (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL,
    key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, key)
);

-- 2. Structured Marks table (for class-wise marks entry and reporting)
-- This table allows for detailed querying of student performance by subject and term.
CREATE TABLE IF NOT EXISTS public.marks_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    term TEXT NOT NULL,
    marks_obtained NUMERIC DEFAULT 0,
    max_marks NUMERIC DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicate entries for the same student/subject/term/year
    UNIQUE(academic_year, student_id, subject_id, term)
);

-- 3. Teachers table (for staff profiles and assignments)
CREATE TABLE IF NOT EXISTS public.teachers_data (
    id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    contact_number TEXT,
    gmail TEXT,
    address TEXT,
    join_date TEXT,
    profile_picture TEXT,
    class_teacher_of TEXT,
    assignments JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (academic_year, id)
);

-- 4. Salary Management table (based on Nepali months)
CREATE TABLE IF NOT EXISTS public.salary_data (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    month TEXT NOT NULL,
    payment_date TEXT,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academic_year, teacher_id, month)
);

-- 5. Expenditures table
CREATE TABLE IF NOT EXISTS public.expenditures_data (
    id TEXT PRIMARY KEY,
    academic_year TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Attendance table
CREATE TABLE IF NOT EXISTS public.attendance_data (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    month TEXT NOT NULL,
    day INTEGER NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academic_year, student_id, month, day)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_data ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all access (for development/demo purposes)
-- In a production environment, these should be restricted to authenticated users.
CREATE POLICY "Allow all access to app_entries" ON public.app_entries
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to marks_data" ON public.marks_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to teachers_data" ON public.teachers_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to salary_data" ON public.salary_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to expenditures_data" ON public.expenditures_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to attendance_data" ON public.attendance_data
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_app_entries_year ON public.app_entries(year);
CREATE INDEX IF NOT EXISTS idx_app_entries_key ON public.app_entries(key);
CREATE INDEX IF NOT EXISTS idx_marks_data_year_class ON public.marks_data(academic_year, class_id);
CREATE INDEX IF NOT EXISTS idx_marks_data_student ON public.marks_data(student_id);
CREATE INDEX IF NOT EXISTS idx_teachers_data_year ON public.teachers_data(academic_year);
CREATE INDEX IF NOT EXISTS idx_salary_data_year_month ON public.salary_data(academic_year, month);
CREATE INDEX IF NOT EXISTS idx_expenditures_data_year ON public.expenditures_data(academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_data_year_month ON public.attendance_data(academic_year, month);
CREATE INDEX IF NOT EXISTS idx_attendance_data_student ON public.attendance_data(student_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_app_entries_updated_at
    BEFORE UPDATE ON public.app_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marks_data_updated_at
    BEFORE UPDATE ON public.marks_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
