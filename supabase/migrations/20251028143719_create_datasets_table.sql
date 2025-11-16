/*
  # Create datasets table

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key) - Unique identifier for each dataset
      - `user_id` (uuid) - Reference to the user who uploaded the dataset
      - `name` (text) - Name of the uploaded file
      - `data` (jsonb) - The actual dataset stored as JSON
      - `columns` (text array) - List of column names in the dataset
      - `row_count` (integer) - Number of rows in the dataset
      - `created_at` (timestamptz) - Timestamp when dataset was uploaded
      - `updated_at` (timestamptz) - Timestamp when dataset was last modified

  2. Security
    - Enable RLS on `datasets` table
    - Add policy for authenticated users to manage their own datasets
    - Add policy for users to view their own datasets
*/

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  data jsonb NOT NULL,
  columns text[] NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own datasets"
  ON datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own datasets"
  ON datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
  ON datasets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
  ON datasets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at DESC);