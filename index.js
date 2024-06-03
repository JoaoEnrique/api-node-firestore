import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import express from 'express';
import bodyParser from "body-parser";

initializeApp({
    credential: cert("./chave.json")
})

const app = express()
const db = getFirestore();
const PORT = 3000;

app.use(bodyParser.json())

app.listen(PORT, ()=>{
    console.log(`http://localhost:${PORT}`);
})


app.get('/', (req, res)=>{
    res.redirect('/agendamentos')
})

app.get('/agendamentos', async(req, res)=>{
    try {
        await db.collection('agendamentos').get().then(queryDocumentSnapshot =>{
            let agendamentos = [];
            queryDocumentSnapshot.forEach(documentSnapshot =>{
                let a = documentSnapshot.data()
                a.id = documentSnapshot.id
                agendamentos.push(a)
            })
            return res.status(200).json(agendamentos)
        }).catch(error =>{
            return res.status(500).json({code: 500, message:`${error}`})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message:`${error}`})
    }
})

app.get('/agendamentos/:id', async (req, res) =>{
    try {
        let id = req.params.id;
        
        if(!id)
            return res.status(400).json({code: 400, message: "id não informado"})

        await db.collection('agendamentos').doc(id).get().then(documentSnapshot =>{
            if(!documentSnapshot.exists)
                return res.status(404).json({code: 404, message: "Agendamento não encontrado"})

            let agendamento = documentSnapshot.data()
            agendamento.id = documentSnapshot.id

            return res.status(200).json(agendamento)
        }).catch(error =>{
            return res.status(500).json({code: 500, message:`${error}`})
        })

    } catch (error) {
        return res.status(500).json({code: 500, message:`${error}`})
    }
})

app.post('/agendamentos', async (req, res) =>{
    try {
        let { nome, data_contato, observacao, origem, telefone }  = req.body
        let data = { nome, data_contato, observacao, origem, telefone };

        if (!nome || !data_contato || !observacao || !origem || !telefone) 
            return res.status(400).json({code: 400, message: "Todos os campos são obrigatórios"})

        let docRef = await db.collection('agendamentos').add(data);

        let id = docRef.id
        let doc = await db.collection('agendamentos').doc(id).get()
        let agendamento = doc.data()
        agendamento.id = doc.id

        return res.status(201).json(agendamento)
    } catch (error) {
        return res.status(500).json({code: 500, message:`${error}`})
    }
})

app.put('/agendamentos/:id', async(req, res) =>{
    let { nome, data_contato, observacao, origem, telefone }  = req.body
    let data = { nome, data_contato, observacao, origem, telefone };
    let id = req.params.id;

    if(!id)
        return res.status(400).json({code: 400, message: "id não informado"})

    if (!nome || !data_contato || !observacao || !origem || !telefone) 
        return res.status(400).json({code: 400, message: "Todos os campos são obrigatórios"})

    let docRef = db.collection('agendamentos').doc(id)
    let doc = await docRef.get();

    if(!doc.exists)
        return res.status(404).json({code: 404, message: "Agendamento não encontrado"})

    docRef.update(data).then(()=>{
        let agendamento = doc.data();
        agendamento.id = doc.id;

        return res.status(200).json(agendamento)
    }).catch(error =>{
        return res.status(500).json({code: 500, message:`${error}`})
    })
})

app.delete('/agendamentos/:id', async(req, res) =>{
    try {
        let id = req.params.id;

        if(!id)
            return res.status(400).json({code: 400, message: "id não informado"})

        let docRef = db.collection('agendamentos').doc(id);
        let doc = await docRef.get()

        if(!doc.exists)
            return res.status(404).json({code: 404, message: "Agendamento não encontrado"})

        await docRef.delete()
        return res.status(200).json({code: 200, message: "Agendamento excluido"})
    } catch (error) {
        return res.status(500).json({code: 500, message:`${error}`})
    }
})

app.use((req, res, next)=>{
    res.status(404).json({code: 404, message: "Página não encontrada"})
})