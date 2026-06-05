import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqjahxvyqpxfvkeutwpm.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamFoeHZ5cXB4ZnZrZXV0d3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjA0MzQsImV4cCI6MjA5NjA5NjQzNH0.V7wqxpSxvk2aDS0mGYM5uzO1L9ZNWzQsunMusWOaZIE';

  return createBrowserClient(url, anonKey);
}
