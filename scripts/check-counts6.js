import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jmvfudupywneitjiwccy.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdmZ1ZHVweXduZWl0aml3Y2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDYxMDIsImV4cCI6MjA4ODUyMjEwMn0.Cp1ee9rbVGlE1JAW4pMRo3XhIvZTH73USUkNcQsg4aM"
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: reports, error } = await supabase
    .from('monthly_reports')
    .select('month, year')

  if (error) {
    console.error('Error querying monthly_reports:', error.message)
    return
  }
  
  const years = [...new Set(reports.map(r => r.year))]
  console.log('Available years:', years)
  
  years.forEach(y => {
      const months = [...new Set(reports.filter(r => r.year === y).map(r => r.month))]
      console.log(`Months for ${y}:`, months)
  })
}

check()
