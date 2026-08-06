import { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { COUNTRY_ROOMS } from "../lib/rooms";

const NATIONALITIES = COUNTRY_ROOMS.map(r => r.country).concat(["Algerian","Other"]);
const UNIVERSITIES = ["USTO-MB (Oran)","Université d'Oran 1","Université d'Oran 2","ENPO (Oran)","Université de Mostaganem","Université d'Alger 1","Université d'Alger 2","Université d'Alger 3","USTHB (Alger)","Université de Constantine 1","Université de Constantine 2","Université de Constantine 3","Université de Annaba","Université de Sétif","Université de Tlemcen","Université de Béjaïa","Université de Tizi Ouzou","Université de Blida","Université de Batna","Other"];
const CITIES = ["Oran","Alger","Constantine","Annaba","Sétif","Tlemcen","Béjaïa","Tizi Ouzou","Blida","Batna","Mostaganem","Other"];
const GENDERS = [{value:"male",icon:"👨",label:"Male"},{value:"female",icon:"👩",label:"Female"},{value:"other",icon:"🧑",label:"Other"},{value:"prefer_not",icon:"🔒",label:"Private"}];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({fullName:"",email:"",password:"",confirmPassword:"",nationality:"",university:"",city:"",gender:""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => { setForm({...form,[e.target.name]:e.target.value}); setError(""); };

  const validateStep1 = () => {
    if(!form.fullName.trim()||form.fullName.trim().length<3) return "Please enter your full name.";
    if(!form.email.trim()) return "Please enter your email.";
    if(form.password.length<6) return "Password must be at least 6 characters.";
    if(form.password!==form.confirmPassword) return "Passwords do not match.";
    if(!form.gender) return "Please select your gender.";
    return null;
  };
  const validateStep2 = () => {
    if(!form.nationality) return "Please select your nationality.";
    if(!form.university) return "Please select your university.";
    if(!form.city) return "Please select your city.";
    return null;
  };

  const handleNext = () => { const err=validateStep1(); if(err){setError(err);return;} setError("");setStep(2); };

  const handleRegister = async e => {
    e.preventDefault();
    const err = validateStep2();
    if(err){setError(err);return;}
    setLoading(true);setError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth,form.email,form.password);
      try { await sendEmailVerification(userCred.user); } catch(e){}
      await setDoc(doc(db,"users",userCred.user.uid),{
        uid:userCred.user.uid,
        fullName:form.fullName.trim(),
        email:form.email.toLowerCase().trim(),
        nationality:form.nationality,
        university:form.university,
        city:form.city,
        gender:form.gender,
        photoURL:"",
        role:"student",
        verified:false,
        suspended:false,
        rating:0,ratingCount:0,
        bio:"",phone:"",
        profileComplete:false,
        online:true,
        following:[],followers:[],blockedUsers:[],
        createdAt:serverTimestamp(),
        lastSeen:serverTimestamp(),
      });
    } catch(err) {
      const code = err.code;
      if(code==="auth/email-already-in-use") setError("This email is already registered.");
      else if(code==="auth/invalid-email") setError("Invalid email address.");
      else if(code==="auth/network-request-failed") setError("No internet connection.");
      else setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:480}}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🌍</span>
          <h1>DiasporaLink</h1>
          <p>Global Community Platform</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          {[1,2].map(s=><div key={s} style={{flex:1,height:3,borderRadius:3,background:step>=s?"var(--primary)":"var(--border)",transition:"background 0.3s"}} />)}
        </div>
        <h2 className="auth-title">{step===1?"Create your account":"Where are you?"}</h2>
        <p className="auth-subtitle">{step===1?"Step 1 of 2 — Personal information":"Step 2 of 2 — Location & university"}</p>
        {error && <div className="error-msg">⚠️ {error}</div>}

        {step===1 && (
          <div>
            <div className="form-group"><label className="form-label">Full Name</label>
              <input name="fullName" type="text" className="form-input" placeholder="As on your passport / ID" value={form.fullName} onChange={handleChange} />
            </div>
            <div className="form-group"><label className="form-label">Email Address</label>
              <input name="email" type="email" className="form-input" placeholder="your@email.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Password</label>
                <input name="password" type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Confirm Password</label>
                <input name="confirmPassword" type="password" className="form-input" placeholder="Repeat" value={form.confirmPassword} onChange={handleChange} /></div>
            </div>
            <div className="form-group"><label className="form-label">Gender</label>
              <div className="gender-select">
                {GENDERS.map(g=>(
                  <div key={g.value} className={"gender-option"+(form.gender===g.value?" selected":"")} onClick={()=>setForm({...form,gender:g.value})}>
                    {g.icon}<span>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={handleNext}>Continue →</button>
          </div>
        )}

        {step===2 && (
          <form onSubmit={handleRegister}>
            <div className="form-group"><label className="form-label">Nationality</label>
              <select name="nationality" className="form-input" value={form.nationality} onChange={handleChange} required>
                <option value="">Select your country...</option>
                {NATIONALITIES.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">University</label>
              <select name="university" className="form-input" value={form.university} onChange={handleChange} required>
                <option value="">Select your university...</option>
                {UNIVERSITIES.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">City</label>
              <select name="city" className="form-input" value={form.city} onChange={handleChange} required>
                <option value="">Select your city...</option>
                {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading?"Creating account...":"Create Account 🚀"}</button>
            <button type="button" className="btn-secondary" style={{marginTop:8}} onClick={()=>{setStep(1);setError("");}}>← Back</button>
          </form>
        )}

        <div className="auth-link">Already have an account? <Link to="/login">Sign in</Link></div>
        <p style={{marginTop:14,fontSize:11,color:"var(--text3)",textAlign:"center",lineHeight:1.7}}>
          By registering, your profile is visible to embassy administrators for verification purposes.
        </p>
      </div>
    </div>
  );
}
