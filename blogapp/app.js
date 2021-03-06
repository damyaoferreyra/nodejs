//Adicionando modulos
const express = require("express")
const handlebars = require("express-handlebars")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const path = require("path") // modulo padrão para manipulação de diretorios
const session = require("express-session")
const flash = require("connect-flash")

const app = express()
const admin = require("./routes/admin")
const usuarios = require("./routes/usuario")

//Modulo de post
require("./models/Post")
const Postagem = mongoose.model("Posts")

//Modulo de categoria
require("./models/Category")
const Categoria = mongoose.model("Categories")

// authentication
const passport = require("passport")
require("./config/auth")(passport)


//Configurações
  // tudo que for app.user se refere a configurações de Midllewares
  // session
  app.use(session({
    secret: "cursodenode",// password
    resave: true,
    saveUminitialized: true
  }))

  // authentication
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(flash())

  // middleware -> chamando antes de todo request
  app.use((req, res, next)=>{
    //Criando variaveis globais
    // console.log("Middleware executado");
    res.locals.success_msg = req.flash("success_msg"),
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null
    next(); // liberar a aplicação
  })

  //body-parser
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())

  // handlebars
  app.engine('handlebars', handlebars({defaultLayout: 'main'}))
  app.set('view engine', 'handlebars')

  //mongoose
  mongoose.Promise = global.Promise
  mongoose.connect("mongodb://localhost/blogapp", {useNewUrlParser: true}).then(()=>{
    console.log("Conectado ao mongodb");
  }).catch((err)=>{
    console.log("erro ao se conectar com o mongodb"+err);
  })

  //Public
  app.use(express.static(path.join(__dirname, "public")))


  //Rotas
  app.get("/", (req, res)=>{
    Postagem.find().populate("categoria").sort({data:"desc"}).then((postagens)=>{
      res.render("index", {postagens: postagens})
    }).catch((Err)=>{
      req.flash("error_msg", "Houve um erro interno")
      res.redirect("/404")
    })
  })
  
  //POSTS inicial
  app.get("/posts/:id", (req, res)=>{
    Postagem.find({_id: req.params.id}).then((postagem)=>{
      if(postagem){
        res.render("postagens/index", {postagem:postagem})
      }else{
        req.flash("error_msg", "Não há detalhes para esta postagem")
        res.redirect("/")
      }
    }).catch((err)=>{
      req.flash("error_msg", "Houve um erro interno")
      res.redirect("/")
    })
  })

  app.get("posts", (req, res)=>{
    res.send("Lista de postagens")
  })

  //Categoria - menu
  app.get("/category", (req, res)=>{
    Categoria.find().sort({date:'desc'}).then((categoria)=>{
      res.render("categorias/index", {categorias: categoria})
    }).catch((error)=>{
      req.flash("error_msg", "Houve um erro ao listar as categorias")
      res.redirect("/")
    })
  })

  app.get("/category/:id", (req, res)=>{
    Postagem.find({categoria: req.params.id}).sort({data:"desc"}).then((postagens)=>{
      res.render("postagens/index", {postagem:postagens})
    })
  })
  
  app.get("/404", (req,res)=>{
    res.send("Erro 404")
  })
  app.use("/admin", admin)
  app.use("/registry", usuarios)

//Outros
const port = 8081
app.listen(port,() =>{
  console.log("Servidor rodando na url http://localhost:"+port);
})
