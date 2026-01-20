
export async function verifyCandidate(data:any){
  const res = await fetch("https://your-api.com/api/verify",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(data)
  });
  return res.json();
}
