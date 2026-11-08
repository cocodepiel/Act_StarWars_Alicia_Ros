const axios = require("axios")
const express = require("express")
const path = require("path")
const methodOverride = require("method-override")
const app = express()
const port = 3000

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"))

let personajes = require("./starwars.json")

function addPhotos() {
    personajes = personajes.map(p => ({
        ...p,
        photo: `../images/${p.name.split(" ")[0]}.jpg`
    }))
    console.log(`Cargados ${personajes.length} personajes`)
}

const buscarPorNombre = nombre => personajes.find(p => p.name.toLowerCase() == nombre.toLowerCase())

app.get("/", (req, res) => res.redirect("/search.html"))

app.get("/starwars", (req, res) => {
    const { q } = req.query
    if (q) {
        const personaje = personajes.find(p => p.name.toLowerCase().includes(q.toLowerCase()))
        if (personaje) res.redirect(`/starwars/${personaje.name}`)
        else res.render("error.ejs", { msg: `No hay ningún personaje que contenga "${q}"` })
    } else {
        res.render("index.ejs", { personajes })
    }
})

app.get("/starwars/new", (req, res) => res.render("new.ejs"))

app.post("/starwars", (req, res) => {
    const { name, height, mass, photo } = req.body
    if (buscarPorNombre(name)) {
        res.render("error.ejs", { msg: `Ya existe un personaje llamado "${name}"` })
    } else {
        personajes.push({ name, height, mass, photo, homeworld: null })
        res.redirect(`/starwars/${name}`)
    }
})

app.get("/starwars/:nombre/edit", (req, res) => {
    const personaje = buscarPorNombre(req.params.nombre)
    if (personaje) res.render("edit.ejs", { personaje })
    else res.render("error.ejs", { msg: "Personaje no encontrado" })
})

app.get("/starwars/:nombre", async (req, res) => {
    const personaje = buscarPorNombre(req.params.nombre)
    if (!personaje) return res.render("error.ejs", { msg: "Personaje no encontrado" })
    let planeta = null
    if (personaje.homeworld) {
        try {
            const respuesta = await axios.get(personaje.homeworld, { timeout: 5000 })
            planeta = respuesta.data
        } catch (error) {
            console.error("No se pudo consultar el homeworld:", error.message)
        }
    }
    res.render("show.ejs", { personaje, planeta })
})

app.patch("/starwars/:nombre", (req, res) => {
    const personaje = buscarPorNombre(req.params.nombre)
    if (!personaje) return res.render("error.ejs", { msg: "Personaje no encontrado" })
    personaje.height = req.body.height
    personaje.mass = req.body.mass
    res.redirect(`/starwars/${personaje.name}`)
})

app.delete("/starwars/:nombre", (req, res) => {
    const antes = personajes.length
    personajes = personajes.filter(p => p.name.toLowerCase() != req.params.nombre.toLowerCase())
    if (personajes.length < antes) res.redirect("/starwars")
    else res.render("error.ejs", { msg: "Personaje no encontrado" })
})

app.use((req, res) => res.render("error.ejs", { msg: "404 - NOT FOUND" }))

app.listen(port, () => {
    console.log(`Servidor en http://localhost:${port}`)
    addPhotos()
})
