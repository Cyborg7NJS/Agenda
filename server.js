const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = 3001;
app.use(express.urlencoded({ extended: true }));

const agendasPath = path.join(__dirname, 'agenda.json');

function lerAgendas() {
    const agendasData = fs.readFileSync(agendasPath, 'utf-8');
    return JSON.parse(agendasData);
}

function salvarDados(LA) {
    fs.writeFileSync(agendasPath, JSON.stringify(LA, null, 2));
}

function truncarDescricao(descricao, comprimentoMaximo) {
    if (typeof descricao !== 'string') return '';
    if (descricao.length > comprimentoMaximo) {
        return descricao.slice(0, comprimentoMaximo) + '...';
    }
    return descricao;
}

app.get('/', (req, res) => {
    const LA = lerAgendas();
    let agendaTable = '';

  LA.forEach((agenda, index) => {
    const descricaoTruncada = truncarDescricao(agenda.desc || '', 100);
    agendaTable += `
        <tr class="tarefa" style="${index >= 10 ? 'display:none;' : ''}">
            <td>${agenda.titulo}</td>
            <td>${descricaoTruncada}</td>
            <td>${agenda.disciplina}</td>
        </tr>
    `;
});


    const htmlContent = fs.readFileSync('index.html', 'utf-8');
    const finalHtml = htmlContent.replace('{{agendaTable}}', agendaTable);

    res.send(finalHtml);
});

app.use(express.static(__dirname));

app.get('/filtrar', (req, res) => {
    const LA = lerAgendas();

    const disciplinas = [];
    LA.forEach(agenda => {
        if (!disciplinas.includes(agenda.disciplina)) {
            disciplinas.push(agenda.disciplina);
        }
    });

    let options = disciplinas.map(disciplina =>
        `<option value="${disciplina}">${disciplina}</option>`
    ).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Filtrar por Disciplina</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container mt-4">
                <h1 class="mb-4">Filtrar por Disciplina</h1>
                <form method="post" action="/filtrar">
                    <div class="mb-3">
                        <label for="disciplina" class="form-label">Selecione a disciplina:</label>
                        <select class="form-select" name="disciplina" id="disciplina" required>
                            <option value="">Selecione a Disciplina</option>
                            ${options}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-outline-dark">Filtrar</button>
                    <a href="/" class="btn btn-outline-secondary">Voltar</a>
                </form>
            </div>
        </body>
        </html>
    `;

    res.send(htmlContent);
});

app.post('/filtrar', (req, res) => {
    const { disciplina } = req.body;
    const LA = lerAgendas();

    const agendasEncontradas = LA.filter(agenda =>
        agenda.disciplina.toLowerCase() === disciplina.toLowerCase()
    );

    if (agendasEncontradas.length > 0) {
        let resultadoHtml = `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1 class="mb-4">Trabalhos da Disciplina: ${disciplina}</h1>
        `;

        agendasEncontradas.forEach(agenda => {
            resultadoHtml += `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${agenda.titulo}</h5>
                        <p class="card-text"><strong>Descrição:</strong> ${agenda.desc}</p>
                        <p class="card-text"><strong>Disciplina:</strong> ${agenda.disciplina}</p>
                    </div>
                </div>
            `;
        });

        resultadoHtml += `
                    <a class="btn btn-outline-dark" href="/filtrar">Nova busca</a>
                    <a class="btn btn-outline-secondary" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `;

        res.send(resultadoHtml);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1 class="text-danger">Nenhum trabalho encontrado para a disciplina "${disciplina}"</h1>
                    <a class="btn btn-outline-dark mt-3" href="/filtrar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
    }
});

app.get('/adicionar', (req, res) => {
    res.sendFile(path.join(__dirname, '/view/adicionar.html'));
});

app.post('/adicionar', (req, res) => {
    const novaAgenda = req.body;
    const LA = lerAgendas();

    if (LA.find(agenda => agenda.titulo.toLowerCase() === novaAgenda.titulo.toLowerCase())) {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda já existe. Não é possível adicionar duplicatas.</h1>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `)
        return;
    }

    LA.push(novaAgenda);

    salvarDados(LA);

    res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda adicionada com sucesso.</h1>                    
                    <a class="btn btn-outline-dark mt-3" href="/adicionar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
});

app.get('/atualizar', (req, res) => {
    let options = '';
    const LA = lerAgendas();

    LA.forEach(agenda => {
        options += `<option value="${agenda.titulo}">${agenda.titulo}</option>`;
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Escolher Agenda para Atualizar</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="container mt-5">
            <h1>Escolha uma agenda para editar</h1>
            <form action="/editar" method="get">
                <select name="titulo" class="form-select mb-3" required>
                    ${options}
                </select>
                <button type="submit" class="btn btn-outline-dark">Editar</button>
            </form>
        </body>
        </html>
    `;

    res.send(htmlContent);
});


app.post('/atualizar', (req, res) => {
    const { titulo, Ntitle, Ndisc, Ndesc } = req.body;
    const LA = lerAgendas();

    const agendaIndex = LA.findIndex(agenda => agenda.titulo.toLowerCase() === titulo.toLowerCase());

    if (agendaIndex === -1) {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Título não encontrado</h1>                  
                    <a class="btn btn-outline-dark mt-3" href="/atualizar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
        return;
    }

    LA[agendaIndex].titulo = Ntitle;
    LA[agendaIndex].disciplina = Ndisc;
    LA[agendaIndex].desc = Ndesc;

    salvarDados(LA);

    res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda atualizada com sucesso!</h1>              
                    <a class="btn btn-outline-dark mt-3" href="/atualizar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
});

app.get('/excluir', (req, res) => {
    const LA = lerAgendas();
    let options = '';

    LA.forEach(agenda => {
        options += `<option value="${agenda.titulo}">${agenda.titulo}</option>`;
    });

    const htmlContent = fs.readFileSync(path.join(__dirname, '/view/excluir.html'), 'utf-8');
    const finalHtml = htmlContent.replace('{{opcoes}}', options);

    res.send(finalHtml);
});

app.get('/editar', (req, res) => {
    const { titulo } = req.query;
    const LA = lerAgendas();

    const agenda = LA.find(a => a.titulo === titulo);
    if (!agenda) {
         return res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda não encontrada!</h1>              
                    <a class="btn btn-outline-dark mt-3" href="/atualizar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Editar Agenda</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="container mt-5">
            <h1>Editar Agenda</h1>
            <form action="/atualizar" method="post">
                <input type="hidden" name="titulo" value="${agenda.titulo}">

                <div class="mb-3">
                    <label for="Ntitle" class="form-label">Novo Título</label>
                    <input type="text" name="Ntitle" class="form-control" value="${agenda.titulo}" required>
                </div>

                <div class="mb-3">
                    <label for="Ndisc" class="form-label">Nova Disciplina</label>
                    <input type="text" name="Ndisc" class="form-control" value="${agenda.disciplina}" required>
                </div>

                <div class="mb-3">
                    <label for="Ndesc" class="form-label">Nova Descrição</label>
                    <textarea name="Ndesc" class="form-control" placeholder="Digite a nova descrição" required></textarea>
                </div>

                <button type="submit" class="btn btn-outline-dark mt-3">Salvar alterações</button>
                <a href="/" class="btn btn-outline-dark mt-3">Cancelar</a>
            </form>
        </body>
        </html>
    `;

    res.send(htmlContent);
});

app.post('/excluir', (req, res) => {
    const { titulo } = req.body;
    const LA = lerAgendas();

    const agendaIndex = LA.findIndex(agenda => agenda.titulo.toLowerCase() === titulo.toLowerCase());

    if (agendaIndex === -1) {
    res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda não encontrada!</h1>              
                    <a class="btn btn-outline-dark mt-3" href="/excluir">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
        return;
    }

    res.send(`
        <script>
            if (confirm('Tem certeza que deseja excluir a agenda "${titulo}"?')) {
                window.location.href = '/excluir-confirmado?titulo=${titulo}';
            } else {
                window.location.href = '/excluir';
            }
        </script>
    `);
});

app.get('/excluir-confirmado', (req, res) => {
    const titulo = req.query.titulo;
    const LA = lerAgendas();

    const agendaIndex = LA.findIndex(agenda => agenda.titulo === titulo);

    if (agendaIndex === -1) {
    res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>Agenda não encontrada!</h1>              
                    <a class="btn btn-outline-dark mt-3" href="/atualizar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
        return;
    }

    LA.splice(agendaIndex, 1);
    salvarDados(LA);

    res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Sem Resultados</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-4">
                    <h1>A agenda "${titulo}" foi excluída com sucesso.</h1>        
                    <a class="btn btn-outline-dark mt-3" href="/atualizar">Tentar novamente</a>
                    <a class="btn btn-outline-secondary mt-3" href="/">Voltar ao início</a>
                </div>
            </body>
            </html>
        `);
});

app.listen(port, () => {
    console.log(`Servidor iniciado em http://localhost:${port}`);
});
