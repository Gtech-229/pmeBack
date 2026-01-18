export const combineDateAndTime =(date: Date, time: string): Date=> {
  const [hours, minutes] = time.split(":").map(Number)
  const d = new Date(date)
  
  d.setHours(hours!, minutes, 0, 0)
  return d
}