import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').replace(/^"|"$/g, '').trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('Querying monthly_reports...')
  
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('month, year, student_id, jilid')

  if (error) {
    console.error('Error querying monthly_reports:', error.message)
  } else {
    console.log(`Found ${data.length} records in monthly_reports.`)
    
    // Group by month and whatever field contains 'iqra' or 'tahsin lanjutan'
    // Actually we need to join with students to get class_type or program if it's there
    
    const may = data.filter(d => d.month === 5 && d.year === 2026)
    const june = data.filter(d => d.month === 6 && d.year === 2026)
    
    console.log('May 2026 reports:', may.length)
    console.log('June 2026 reports:', june.length)
    if (data.length > 0) console.log('Sample report:', data[0])
  }

  // Also query students table
  console.log('Querying students...')
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    
  if (studentError) {
    console.error('Error querying students:', studentError.message)
  } else {
    console.log(`Found ${students.length} records in students.`)
    if (students.length > 0) {
        console.log('Sample student fields:', Object.keys(students[0]))
        console.log('Sample student:', students[0])
    }
    
    // Check if there are iqra or tahsin lanjutan
    const iqraCount = students.filter(s => s.class_type && s.class_type.toLowerCase().includes('iqra')).length
    const tahsinCount = students.filter(s => s.class_type && s.class_type.toLowerCase().includes('tahsin')).length
    
    console.log('Students with Iqra:', iqraCount)
    console.log('Students with Tahsin:', tahsinCount)
  }
}

check()
