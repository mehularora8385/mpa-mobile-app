
export async function verify(roll:string){
 return fetch("https://API_URL/api/verify",{
  method:"POST",
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({roll})
 }).then(r=>r.json());
}
