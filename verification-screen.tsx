
import {verifyCandidate} from './verification-service';

export async function submitVerification(candidate:any){
  const payload={
    roll_no:candidate.roll,
    exam_code:candidate.exam,
    centre_code:candidate.centre,
    face:candidate.faceImage,
    fingerprint:candidate.fingerprint,
    omr:candidate.omrImage
  };

  const res=await verifyCandidate(payload);
  alert(res.message);
}
