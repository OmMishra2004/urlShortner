const form=document.getElementById("form")
const handleSubmit=async(event)=>{
    event.preventDefault()
    const formData=new FormData(event.target)
    const url=formData.get("url")
    const shortCode=formData.get("shortCode")

const fetchShortenedURL=async () => {
    try {
        const res=await fetch("/links")
        if(!res.ok){
            throw new Error(await res.text())
        }
        const links=await res.json()
        const list=document.getElementById("shortened-urls")
        list.innerHTML=""
        for(const [shortCode,url] of Object.entries(links)){
            const li=document.createElement('li')
            li.innerHTML=`<a href="/${shortCode}" target="_blank">${window.location.origin}/${shortCode}</a> - ${url}`
            list.appendChild(li)
        }
    } catch (error) {
        console.error(error)
    }
}
    
    // sending data to backend
    try {
        const res=await fetch("/shorten",{
            method:"POST",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({url,shortCode})
        })
        if(!res.ok){
            throw new Error(await res.text())
        }else{
            alert("Form submitted successfully")
            event.target.reset()
            fetchShortenedURL()
        }
    } catch (error) {
        alert(error.message)
    }
}
form.addEventListener("submit",handleSubmit)