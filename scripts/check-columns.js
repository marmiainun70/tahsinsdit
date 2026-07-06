import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jmvfudupywneitjiwccy.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdmZ1ZHVweXduZWl0aml3Y2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDYxMDIsImV4cCI6MjA4ODUyMjEwMn0.Cp1ee9rbVGlE1JAW4pMRo3XhIvZTH73USUkNcQsg4aM"
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .limit(1)
    
  if (studentError) {
    console.error('Error querying students:', studentError.message)
    return
  }
  
  if (students.length > 0) {
      console.log('Student columns:', Object.keys(students[0]))
  }
  
  const { data: reports, error: reportError } = await supabase
    .from('monthly_reports')
    .select('*')
    .limit(1)
    
  if (reportError) {
    console.error('Error querying monthly_reports:', reportError.message)
    return
  }
  
  if (reports.length > 0) {
      console.log('Report columns:', Object.keys(reports[0]))
  }
}

check()
