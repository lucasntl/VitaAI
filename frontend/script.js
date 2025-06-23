// Aguarda o carregamento completo do HTML para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Identifica em qual página o script está sendo executado para chamar a função correta
    const path = window.location.pathname.split("/").pop();

    if (path.startsWith('questionario')) {
        setupQuestionnaireListeners();
    } else if (path === 'home.html') {
        setupHomePage();
    } else if (path === 'treinos.html') {
        displayFullWorkoutPlan();
    } else if (path === 'dietas.html') {
        displayFullDietPlan();
    }
});

/**
 * Configura os event listeners para todas as páginas do questionário.
 * ESTA É A VERSÃO CORRIGIDA E MAIS ROBUSTA.
 */
function setupQuestionnaireListeners() {
    const form = document.querySelector('form');
    // Seleciona TODOS os botões de navegação dentro do formulário ou do contêiner principal
    const navButtons = document.querySelectorAll('button[type="submit"]');

    if (form && navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault(); // Previne a ação padrão do botão

                // Pega o link 'a' que está dentro do botão clicado
                const link = button.querySelector('a');
                if (!link) return; // Se não houver link, não faz nada

                // Pega ou cria um perfil de usuário no localStorage
                let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

                // Salva os dados do formulário atual
                const formData = new FormData(form);
                for (let [key, value] of formData.entries()) {
                    // Mapeia os nomes dos campos para chaves mais limpas
                    const keyMap = {
                        'perg': 'objetivo',
                        'perg3': 'nivel',
                        'perg4': 'dias',
                        'perg5': 'dieta',
                        'genero': 'genero'
                    };
                    // O campo de nome é pego de forma diferente, pois não tem 'name'
                    const nomeInput = form.querySelector('input[type="text"]');
                    if (nomeInput) {
                        userProfile.nome = nomeInput.value;
                    }

                     if (keyMap[key]) {
                        userProfile[keyMap[key]] = value;
                    }
                }

                // Converte os valores do questionário para as chaves do JSON
                if (userProfile.objetivo === '1') userProfile.objetivo = 'perda_de_peso';
                if (userProfile.objetivo === '2') userProfile.objetivo = 'ganho_de_massa_muscular';
                if (userProfile.objetivo === '5') userProfile.objetivo = 'aumentar_forca';

                if (userProfile.nivel === '1') userProfile.nivel = 'iniciante';
                if (userProfile.nivel === '2') userProfile.nivel = 'intermediario';
                if (userProfile.nivel === '3') userProfile.nivel = 'avancado';

                if (userProfile.dias === '2') userProfile.dias = '3_dias';
                if (userProfile.dias === '3') userProfile.dias = '5_dias';
                if (userProfile.dias === '4') userProfile.dias = '7_dias';

                if (userProfile.dieta === '1') userProfile.dieta = 'Normal';
                if (userProfile.dieta === '2') userProfile.dieta = 'Vegetariana';
                if (userProfile.dieta === '3') userProfile.dieta = 'Vegana';


                // Salva o perfil atualizado no localStorage
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                
                // Redireciona para o href do link dentro do botão
                window.location.href = link.getAttribute('href');
            });
        });
    }
}

/**
 * Configura o botão "Gerar Planos" na página home.html.
 */
function setupHomePage() {
    const generateButton = document.querySelector('button.btn-success');
    if (generateButton) {
        generateButton.addEventListener('click', generateAndDisplayPlans);
    }
     // Tenta carregar o resumo se os planos já foram gerados
    displaySummaryPlans();
}


/**
 * Função principal para gerar os planos.
 * É assíncrona para poder usar 'await' com fetch.
 */
async function generateAndDisplayPlans() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));

    if (!userProfile || !userProfile.objetivo || !userProfile.nivel || !userProfile.dias || !userProfile.dieta) {
        alert("Por favor, preencha o questionário primeiro para gerar seus planos!");
        window.location.href = 'questionario1.html';
        return;
    }

    try {
        // Busca os dois arquivos JSON ao mesmo tempo
        const [treinosResponse, dietasResponse] = await Promise.all([
            fetch('treinos.json'),
            fetch('dietas.json')
        ]);

        const treinosData = await treinosResponse.json();
        const dietasData = await dietasResponse.json();

        // Encontra o plano de treino correto baseado no perfil do usuário
        const workoutPlan = treinosData.rotinas_de_treino[userProfile.objetivo][userProfile.nivel][userProfile.dias];

        // Encontra o plano de dieta correto
        const dietPlan = dietasData[userProfile.dieta];

        // Salva os planos completos no localStorage para uso em outras páginas
        localStorage.setItem('selectedWorkoutPlan', JSON.stringify(workoutPlan));
        localStorage.setItem('selectedDietPlan', JSON.stringify(dietPlan));

        alert("Planos gerados e salvos com sucesso!");

        // Atualiza o resumo na página home.html
        displaySummaryPlans();

    } catch (error) {
        console.error("Erro ao carregar ou processar os arquivos JSON:", error);
        alert("Ocorreu um erro ao gerar seus planos. Tente novamente.");
    }
}

/**
 * Exibe o resumo dos planos na página home.html.
 */
function displaySummaryPlans() {
    const workoutPlan = JSON.parse(localStorage.getItem('selectedWorkoutPlan'));
    const dietPlan = JSON.parse(localStorage.getItem('selectedDietPlan'));
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));


    if (!workoutPlan || !dietPlan || !userProfile) {
        // Não faz nada se os planos ainda não foram gerados
        return;
    }
    
    // Atualiza o card de Treinos
    document.getElementById('objetivoTreino').textContent = `Objetivo: ${userProfile.objetivo.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}`;
    document.getElementById('muscularTreino').textContent = `Foco do Dia: ${workoutPlan[0].dia}`;
    document.getElementById('exercicioTreino').textContent = `Nº de Exercícios (Dia 1): ${workoutPlan[0].exercicios.length}`;
    document.getElementById('tempoTreino').textContent = "Tempo Estimado: 45-60 minutos";

    // Atualiza o card de Nutrição
    document.getElementById('restricaoNutri').textContent = `Tipo de Dieta: ${userProfile.dieta}`;
    document.getElementById('refeicaoNutri').textContent = `Quantidade de Refeições: ${dietPlan.refeicoes_por_dia}`;
    document.getElementById('caloriaNutri').textContent = `Meta calórica do dia: ${dietPlan.dias[0].calorias_totais} calorias`;
}


/**
 * Exibe o plano de treino completo na página treinos.html.
 */
function displayFullWorkoutPlan() {
    const workoutPlan = JSON.parse(localStorage.getItem('selectedWorkoutPlan'));

    if (!workoutPlan) {
        document.querySelector('main').innerHTML = '<h1>Nenhum plano de treino encontrado.</h1><p>Por favor, <a href="questionario1.html">preencha o questionário</a> e gere seus planos na página inicial.</p>';
        return;
    }
    
    const weekDaysMap = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

    workoutPlan.forEach((dayPlan, index) => {
        const dayId = weekDaysMap[index];
        const dayTitleEl = document.getElementById(`${dayId}tema`);
        const exerciseListEl = dayTitleEl.closest('.secao-treino').querySelector('ul');
        
        // Limpa a lista de exercícios padrão
        exerciseListEl.innerHTML = '';
        
        // Define o título do treino do dia
        dayTitleEl.textContent = dayPlan.dia;
        
        // Adiciona os novos exercícios
        dayPlan.exercicios.forEach(ex => {
            const li = document.createElement('li');
            let text = `${ex.nome} - ${ex.series || ''}x ${ex.repeticoes || ex.tempo}`;
            if(ex.observacao) text += ` (${ex.observacao})`;
            li.textContent = text;
            exerciseListEl.appendChild(li);
        });
    });

    // Oculta os dias da semana que não têm treino (caso o plano seja de 3 ou 5 dias)
    const allSections = document.querySelectorAll('.secao-treino');
    allSections.forEach((section, index) => {
        if (index >= workoutPlan.length) {
            section.style.display = 'none';
        }
    });
}

/**
 * Exibe o plano de dieta completo na página dietas.html.
 */
function displayFullDietPlan() {
    const dietPlan = JSON.parse(localStorage.getItem('selectedDietPlan'));
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));


    if (!dietPlan) {
        document.querySelector('main').innerHTML = '<h1>Nenhum plano de dieta encontrado.</h1><p>Por favor, <a href="questionario1.html">preencha o questionário</a> e gere seus planos na página inicial.</p>';
        return;
    }

    const weekDaysMap = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

    dietPlan.dias.forEach((dayPlan, index) => {
        const dayId = weekDaysMap[index];
        const section = document.getElementById(`${dayId}1`)?.closest('.secao-treino');

        if(section){
            const titleEl = section.querySelector('.tipo-treino');
            const mealListEl = section.querySelector('ul');

            // Limpa a lista padrão
            mealListEl.innerHTML = '';
            
            // Adiciona o total de calorias como título do dia
            titleEl.textContent = `Total: ${dayPlan.calorias_totais} kcal`;

            // Adiciona as refeições
            dayPlan.refeicoes.forEach(meal => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${meal.nome}:</strong> ${meal.descricao}`;
                mealListEl.appendChild(li);
            });
        }
    });
}
