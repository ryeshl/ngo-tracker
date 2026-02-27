-- Create the lean Expenses table
create table public.expenses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    project_id text not null, -- Crucial for routing data to the Transparency Dashboard
    amount numeric(12, 2) not null,
    currency text default 'GBP',
    vendor_name text,
    category text,
    expense_date date not null,
    receipt_image_url text, -- URL to the image in Supabase Storage
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable strict Row Level Security (RLS) for compliance
alter table public.expenses enable row level security;

-- Field workers can only write and read their own expense records
create policy "Users can insert their own expenses" 
on public.expenses for insert with check (auth.uid() = user_id);

create policy "Users can view their own expenses" 
on public.expenses for select using (auth.uid() = user_id);