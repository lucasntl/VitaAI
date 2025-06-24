document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();

    if (path.startsWith('questionario')) {
        if (path === 'questionario3.html') {
            setupQuestionnaire3Page();
        } else {
            setupQuestionnaireListeners();
        }
    } else if (path === 'treinos.html') {
        displayFullWorkoutPlan();
    } else if (path === 'dietas.html') {
        displayFullDietPlan();
    }
});

function setupQuestionnaireListeners() {
    const form = document.querySelector('form');
    const navButtons = document.querySelectorAll('button[type="submit"]');

    if (form && navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();

                const link = button.querySelector('a');
                if (!link) return;

                let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

                const formData = new FormData(form);
                for (let [key, value] of formData.entries()) {
                    const keyMap = {
                        'perg': 'objetivo',
                        'perg3': 'nivel',
                        'perg4': 'dias',
                        'perg5': 'dieta',
                        'genero': 'genero'
                    };
                    const nomeInput = form.querySelector('input[type="text"]');
                    if (nomeInput) {
                        userProfile.nome = nomeInput.value;
                    }

                    if (keyMap[key]) {
                        userProfile[keyMap[key]] = value;
                    }
                }

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

                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                window.location.href = link.getAttribute('href');
            });
        });
    }
}

/* Gerar/Salvar Planos */
async function generateAndDisplayPlans() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));

    if (!userProfile || !userProfile.objetivo || !userProfile.nivel || !userProfile.dias || !userProfile.dieta) {
        alert("Por favor, preencha o questionário primeiro para gerar seus planos!");
        window.location.href = 'questionario1.html';
        return;
    }

    try {
        const [treinosResponse, dietasResponse] = await Promise.all([
            fetch('treinos.json'),
            fetch('dietas.json')
        ]);

        const treinosData = await treinosResponse.json();
        const dietasData = await dietasResponse.json();

        const workoutPlan = treinosData.rotinas_de_treino[userProfile.objetivo][userProfile.nivel][userProfile.dias];
        const dietPlan = dietasData[userProfile.dieta];

        localStorage.setItem('selectedWorkoutPlan', JSON.stringify(workoutPlan));
        localStorage.setItem('selectedDietPlan', JSON.stringify(dietPlan));

        alert("Planos gerados e salvos com sucesso!");

    } catch (error) {
        console.error("Erro ao carregar ou processar os arquivos JSON:", error);
        alert("Ocorreu um erro ao gerar seus planos. Tente novamente.");
    }
}

/* Treinos */
function displayFullWorkoutPlan() {
    const workoutPlan = JSON.parse(localStorage.getItem('selectedWorkoutPlan'));

    if (!workoutPlan) {
        document.querySelector('main').innerHTML = '<h1>Nenhum plano de treino encontrado.</h1><p>Por favor, <a href="questionario1.html">preencha o questionário</a> e gere seus planos na página inicial.</p>';
        return;
    }

    const weekDaysMap = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const allSections = document.querySelectorAll('.grid1 .cartao, .grid2 .cartao');

    workoutPlan.forEach((dayPlan, index) => {
        if (allSections[index]) {
            const currentCard = allSections[index];
            const dayTitleEl = currentCard.querySelector('.tipo-treino');
            const exerciseListEl = currentCard.querySelector('ul');

            exerciseListEl.innerHTML = '';
            dayTitleEl.textContent = dayPlan.dia;

            dayPlan.exercicios.forEach(ex => {
                const li = document.createElement('li');

                if (ex.exercicios_circuito) {
                    let circuitText = `<strong>${ex.nome}</strong> (${ex.descricao}):<ul>`;
                    ex.exercicios_circuito.forEach(circuitEx => {
                        circuitText += `<li>${circuitEx.nome} - ${circuitEx.repeticoes || circuitEx.tempo}</li>`;
                    });
                    circuitText += '</ul>';
                    li.innerHTML = circuitText;
                } else {
                    let text = `${ex.nome} - ${ex.series || ''}x ${ex.repeticoes || ex.tempo}`;
                    if (ex.observacao) text += ` (${ex.observacao})`;
                    li.textContent = text;
                }

                exerciseListEl.appendChild(li);
            });
        }
    });

    allSections.forEach((section, index) => {
        if (index >= workoutPlan.length) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    });

    const visibleCards = workoutPlan.length;
    const grid1 = document.querySelector('.grid1');
    const grid2 = document.querySelector('.grid2');

    grid1.classList.remove('cards-3', 'cards-5', 'cards-7');
    grid2.classList.remove('cards-3', 'cards-5', 'cards-7');

    if (visibleCards <= 4) {
        grid1.classList.add(`cards-${visibleCards}`);
        grid2.style.display = 'none';
    } else {
        grid1.classList.add('cards-4');
        grid2.classList.add(`cards-${visibleCards - 4}`);
        grid2.style.display = 'grid';
    }
}

/* Dietas */
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

            mealListEl.innerHTML = '';
            titleEl.textContent = `Total: ${dayPlan.calorias_totais} kcal`;

            dayPlan.refeicoes.forEach(meal => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${meal.nome}:</strong> ${meal.descricao}`;
                mealListEl.appendChild(li);
            });
        }
    });
}

/* Funcionamento botão / processamento */
function setupQuestionnaire3Page() {
    setupQuestionnaireListeners();

    const generateButton = document.querySelector('button.btn-success');
    if (generateButton) {
        generateButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const form = document.querySelector('form');
            if (form) {
                let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

                const formData = new FormData(form);
                for (let [key, value] of formData.entries()) {
                    const keyMap = {
                        'perg': 'objetivo',
                        'perg3': 'nivel',
                        'perg4': 'dias',
                        'perg5': 'dieta',
                        'genero': 'genero'
                    };

                    if (keyMap[key]) {
                        userProfile[keyMap[key]] = value;
                    }
                }

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

                localStorage.setItem('userProfile', JSON.stringify(userProfile));
            }

            await generateAndDisplayPlans();
            window.location.href = 'home.html';
        });
    }
}
