
export async function markPresent(roll:string){
 return fetch("https://API_URL/api/att/present",{
  method:"POST",
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({roll})
 }).then(r=>r.json());
}
