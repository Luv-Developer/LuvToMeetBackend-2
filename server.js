require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const PORT = process.env.PORT || 5000
const SUPABASEURL = process.env.SUPABASEURL
const SUPABASEKEY = process.env.SUPABASEKEY
const ADMINMAIL = process.env.ADMINMAIL
const LOCALPASS = process.env.LOCALPASS
const SECRETKEY = process.env.SECRETKEY
const {createClient} = require("@supabase/supabase-js")
let supabase = null
if (SUPABASEURL && SUPABASEKEY) {
    try {
        supabase = createClient(SUPABASEURL, SUPABASEKEY)
    } catch (err) {
        console.error('Failed to create Supabase client:', err)
        supabase = null
    }
} else {
    console.warn('SUPABASEURL or SUPABASEKEY not set — Supabase client disabled.')
}
const http = require("http")
const cookieParser = require("cookie-parser")
const cors = require("cors")


// Middleware
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))

// Cors Configuation
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

// Note: preflight (OPTIONS) is handled by the main CORS middleware above

// Routes
app.get("/",(req,res)=>{
    res.send("hello world")
})
app.post("/signin",async(req,res)=>{
    let {name,email} = req.body
    if (!supabase) {
        console.warn('Supabase client not configured — bypassing DB and returning redirect for dev.')
        return res.json({ success: true, redirect: "http://localhost:5173/room" })
    }

    const { data: user, error: selectError } = await supabase
    .from("users1")
    .select("name,email")
    .eq("email",email)
    .maybeSingle()
    if (selectError) {
        console.error('Supabase select error:', selectError)
        return res.status(500).json({ success: false, error: selectError.message })
    }
    if(!user){
        let today = new Date()
        let date = String(today.getDate()).padStart(2,"0")
        let month = String(today.getMonth()+1).padStart(2,"0")
        let year = today.getFullYear()
        today = date + "/" + month + "/" + year
        const { data: updateuser, error: insertError } = await supabase
        .from("users1")
        .insert([{
            name: name,
            email: email,
            date: today
        }])
        if (insertError) {
            console.error('Supabase insert error:', insertError)
            return res.status(500).json({ success: false, error: insertError.message })
        }
        console.log('Inserted user:', updateuser)
        return res.json({ success: true, redirect: "http://localhost:5173/room" })
    }
    else{
        return res.json({ success: true, redirect: "http://localhost:5173/room" })
    }
})

// Listening / Hosting 
app.listen(PORT, ()=>{
    console.log(`App is listening at ${PORT}`)
})