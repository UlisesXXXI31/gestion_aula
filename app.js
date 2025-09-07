document.addEventListener('DOMContentLoaded', () => {
    const gradesTableBody = document.querySelector('#gradesTable tbody');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const addStudentModal = document.getElementById('addStudentModal');
    const newStudentNameInput = document.getElementById('newStudentName');
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');


    // Elementos para la gestión de cursos/clases
    const courseSelector = document.getElementById('courseSelector');
    const classSelector = document.getElementById('classSelector');
    const addClassBtn = document.getElementById('addClassBtn');
    const addClassModal = document.getElementById('addClassModal');
    const newClassCourseSelector = document.getElementById('newClassCourseSelector');
    const newClassNameInput = document.getElementById('newClassName');
    const saveClassBtn = document.getElementById('saveClassBtn');

    // Elementos para el detalle del alumno y gestión de grados
    const studentDetailModal = document.getElementById('studentDetailModal');
    const studentDetailName = document.getElementById('studentDetailName');
    const detailPositives = document.getElementById('detailPositives');
    const detailNegatives = document.getElementById('detailNegatives');
    const detailFinalGlobal = document.getElementById('detailFinalGlobal');
    const detailEval1 = document.getElementById('detailEval1');
    const detailEval2 = document.getElementById('detailEval2');
    // NUEVO: Elementos para 3ª Evaluación y Nota Final de Curso en el modal de detalle
    const detailEval3 = document.getElementById('detailEval3');
    const detailFinalCourse = document.getElementById('detailFinalCourse');

    const addGradeBtn = document.getElementById('addGradeBtn');
    const gradesContainer = document.getElementById('gradesContainer');

    // Elementos para el modal de añadir/editar grado
    const gradeModal = document.getElementById('gradeModal');
    const gradeModalTitle = document.getElementById('gradeModalTitle');
    const gradeNumberInput = document.getElementById('gradeNumber');
    const gradeNameInput = document.getElementById('gradeName');
    const gradeClassworkInput = document.getElementById('gradeClasswork');
    const gradeBehaviorInput = document.getElementById('gradeBehavior');
    const gradeGoetheInput = document.getElementById('gradeGoethe');
    const gradeExamInput = document.getElementById('gradeExam');
    const saveGradeBtn = document.getElementById('saveGradeBtn');

    // Botones de cierre de modal
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            modal.classList.remove('active');
            
            // Limpiar inputs de todos los modales
            newStudentNameInput.value = '';
            newClassNameInput.value = '';
            newClassCourseSelector.value = '';
            gradeNumberInput.value = '';
            gradeNameInput.value = '';
            gradeClassworkInput.value = '0';
            gradeBehaviorInput.value = '0';
            gradeGoetheInput.value = '0';
            gradeExamInput.value = '0';
            
            editingGradeId = null; // Siempre resetear ID de grado en edición
            
            if (modal.id === 'studentDetailModal') {
                currentStudentId = null; // Resetear el ID del alumno actual cuando se cierra su modal de detalle
            }
        });
    });

    // Estado global de la aplicación
    let appData = loadAppData();
    let currentCourse = null;
    let currentClass = null;
    let currentStudentId = null; // ID del estudiante que estamos viendo en el modal de detalle
    let editingGradeId = null; // ID del grado que estamos editando

    // --- Funciones de Carga y Guardado de Datos ---
    function saveAppData() {
        localStorage.setItem('gradeAppV2Data', JSON.stringify(appData));
    }

    function loadAppData() {
        const storedData = localStorage.getItem('gradeAppV2Data');
        return storedData ? JSON.parse(storedData) : {
            primaria: {},
            secundaria: {}
        };
    }

    // --- Funciones de UI y Renderizado ---
    function updateClassSelector() {
        classSelector.innerHTML = '<option value="">Seleccionar Clase</option>';
        classSelector.disabled = true;
        if (currentCourse && appData[currentCourse]) {
            const classesInCourse = appData[currentCourse];
            for (const classId in classesInCourse) {
                const option = document.createElement('option');
                option.value = classId;
                option.textContent = classesInCourse[classId].name;
                classSelector.appendChild(option);
            }
            classSelector.disabled = false;
        }
        classSelector.value = currentClass || '';
        
        // Habilitar/deshabilitar el botón de exportar según si hay una clase seleccionada
        if (exportStudentsBtn) {
            exportStudentsBtn.disabled = !currentClass;
        }
    }

    // Función para calcular la nota final de un *grado* específico
    // AHORA INCLUYE el impacto de positivos/negativos
    function calculateGradeFinalScore(grade, student) {
        const examWeight = 0.70;
        const columnWeight = 0.10;

        // Asegurarse de que los valores son números, si no, usar 0
        const classwork = parseFloat(grade.classwork) || 0;
        const behavior = parseFloat(grade.behavior) || 0;
        const goethe = parseFloat(grade.goethe) || 0;
        const exam = parseFloat(grade.exam) || 0;

        let baseGrade = (exam * examWeight) +
                        (classwork * columnWeight) +
                        (behavior * columnWeight) +
                        (goethe * columnWeight);

        // APLICAR EL IMPACTO DE POSITIVOS Y NEGATIVOS A CADA GRADO ESPECÍFICO
        const positiveImpactPerGrade = 0.03; 
        const negativeImpactPerGrade = -0.03; 

        if (student) { 
            baseGrade += (student.positives * positiveImpactPerGrade);
            baseGrade += (student.negatives * negativeImpactPerGrade);
        }

        return Math.max(0, Math.min(10, baseGrade)); 
    }

    // Función principal para obtener un estudiante por su ID
    function getStudentById(id) {
        if (!currentCourse || !currentClass || !appData[currentCourse][currentClass]) {
            return null;
        }
        const studentIdNum = parseInt(id);
        return appData[currentCourse][currentClass].students.find(s => s.id === studentIdNum);
    }

    // Calcular la Nota Final Global del Alumno (media de todos los grados ajustados)
    function calculateStudentFinalGlobalGrade(student) {
        if (!student || !student.grades || student.grades.length === 0) {
            return 'N/A';
        }

        let sumOfGradeScores = 0;
        let countOfValidGrades = 0;

        student.grades.forEach(grade => {
            const gradeFinalScore = calculateGradeFinalScore(grade, student); 
            if (!isNaN(gradeFinalScore)) { 
                sumOfGradeScores += gradeFinalScore;
                countOfValidGrades++;
            }
        });

        if (countOfValidGrades === 0) return 'N/A';
        let averageGradeScores = sumOfGradeScores / countOfValidGrades;
        return Math.max(0, Math.min(10, averageGradeScores)).toFixed(2);
    }

    // Calcular la nota de una evaluación específica (1ª, 2ª o 3ª)
    function calculateEvaluationGrade(student, evaluationNumber) {
        if (!student || !student.grades || student.grades.length === 0) {
            return 'N/A';
        }

        let gradesToConsider = [];
        if (evaluationNumber === 1) {
            // Grados 1 a 5 para 1ª evaluación
            gradesToConsider = student.grades.filter(g => g.number >= 1 && g.number <= 5);
        } else if (evaluationNumber === 2) {
            // Grados 6 a 9 para 2ª evaluación
            gradesToConsider = student.grades.filter(g => g.number >= 6 && g.number <= 9);
        } else if (evaluationNumber === 3) {
            // Grado 12 para 3ª evaluación (basado solo en el Grado 12)
            gradesToConsider = student.grades.filter(g => g.number === 12);
            // Si no hay grado 12, esta evaluación no tiene nota
            if (gradesToConsider.length === 0) return 'N/A';
        } else {
            return 'N/A';
        }

        let sumOfScores = 0;
        let countOfValidScores = 0;

        gradesToConsider.forEach(grade => {
            const finalGradeScore = calculateGradeFinalScore(grade, student); 
            if (!isNaN(finalGradeScore)) { 
                sumOfScores += finalGradeScore;
                countOfValidScores++;
            }
        });

        if (countOfValidScores === 0) {
            return 'N/A';
        }
        let averageEvaluationScore = sumOfScores / countOfValidScores;
        return Math.max(0, Math.min(10, averageEvaluationScore)).toFixed(2);
    }

    // NUEVA FUNCIÓN: Calcular la Nota Final de Curso (media de 1ª, 2ª y 3ª Evaluación)
    function calculateFinalCourseGrade(student) {
        const eval1 = parseFloat(calculateEvaluationGrade(student, 1));
        const eval2 = parseFloat(calculateEvaluationGrade(student, 2));
        const eval3 = parseFloat(calculateEvaluationGrade(student, 3));

        let sumEvals = 0;
        let countValidEvals = 0;

        if (!isNaN(eval1)) { sumEvals += eval1; countValidEvals++; }
        if (!isNaN(eval2)) { sumEvals += eval2; countValidEvals++; }
        if (!isNaN(eval3)) { sumEvals += eval3; countValidEvals++; }

        if (countValidEvals === 0) return 'N/A';
        
        let finalCourseScore = sumEvals / countValidEvals;
        return Math.max(0, Math.min(10, finalCourseScore)).toFixed(2);
    }


    // Función para renderizar un estudiante en la tabla principal
    function renderStudentRow(student) {
        const row = gradesTableBody.insertRow();
        row.dataset.id = student.id;

        row.innerHTML = `
            <td><a href="#" class="student-name-link" data-id="${student.id}">${student.name}</a></td>
            <td class="positives-cell">
                <button class="count-btn positive-control-btn" data-action="increment-positive" data-student-id="${student.id}">+</button>
                <span class="positive-count positive-display">${student.positives}</span>
                <button class="count-btn negative-control-btn" data-action="decrement-positive" data-student-id="${student.id}">-</button>
            </td>
            <td class="negatives-cell">
                <button class="count-btn positive-control-btn" data-action="increment-negative" data-student-id="${student.id}">+</button>
                <span class="negative-count negative-display">${student.negatives}</span>
                <button class="count-btn negative-control-btn" data-action="decrement-negative" data-student-id="${student.id}">-</button>
            </td>
            <td class="final-grade">${calculateStudentFinalGlobalGrade(student)}</td>
            <td class="final-grade eval-grade">${calculateEvaluationGrade(student, 1)}</td>
            <td class="final-grade eval-grade">${calculateEvaluationGrade(student, 2)}</td>
            <!-- NUEVAS CELDAS DE DATOS -->
            <td class="final-grade eval-grade">${calculateEvaluationGrade(student, 3)}</td> 
            <td class="final-grade course-grade">${calculateFinalCourseGrade(student)}</td>
            <td><button class="delete-btn" data-student-id="${student.id}">Eliminar</button></td>
        `;
    }

    // Función para renderizar todos los estudiantes de la clase actual
    function renderCurrentClassStudents() {
        gradesTableBody.innerHTML = ''; // Limpiar tabla

        if (currentCourse && currentClass && appData[currentCourse][currentClass]) {
            const students = appData[currentCourse][currentClass].students;
            students.forEach(renderStudentRow);
            addStudentBtn.disabled = false;
        } else {
            addStudentBtn.disabled = true;
        }
        if (exportStudentsBtn) {
            exportStudentsBtn.disabled = !currentClass || (currentClass && appData[currentCourse][currentClass].students.length === 0);
        }
    }

    // Renderiza los grados de un alumno en el modal de detalle
    function renderStudentGradesInDetail(student) {
        gradesContainer.innerHTML = '';
        if (!student || !student.grades || student.grades.length === 0) {
            gradesContainer.innerHTML = '<p>Este alumno aún no tiene grados registrados.</p>';
            return;
        }

        student.grades.sort((a, b) => a.number - b.number).forEach(grade => {
            const gradeCard = document.createElement('div');
            gradeCard.classList.add('grade-card');
            gradeCard.dataset.gradeId = grade.id;

            const finalGradeScoreAdjusted = calculateGradeFinalScore(grade, student);

            gradeCard.innerHTML = `
                <h4>Grado ${grade.number} ${grade.name ? `(${grade.name})` : ''}</h4>
                <p>Trabajo Clase: ${parseFloat(grade.classwork).toFixed(2)}</p>
                <p>Comportamiento: ${parseFloat(grade.behavior).toFixed(2)}</p>
                <p>Goethe: ${parseFloat(grade.goethe).toFixed(2)}</p>
                <p>Examen: ${parseFloat(grade.exam).toFixed(2)}</p>
                <p class="grade-final">Nota Final Grado (ajustada): ${finalGradeScoreAdjusted.toFixed(2)}</p>
                <div class="grade-card-actions">
                    <button class="edit-grade-btn" data-grade-id="${grade.id}">Editar</button>
                    <button class="delete-grade-btn" data-grade-id="${grade.id}">Eliminar</button>
                </div>
            `;
            gradesContainer.appendChild(gradeCard);
        });
    }

    // Abre el modal de detalle del alumno
    function openStudentDetailModal(studentId) {
        currentStudentId = studentId; 
        const student = getStudentById(currentStudentId);

        if (student) {
            studentDetailName.textContent = `Detalles de ${student.name}`;
            detailPositives.textContent = student.positives;
            detailNegatives.textContent = student.negatives;
            detailFinalGlobal.textContent = calculateStudentFinalGlobalGrade(student);
            detailEval1.textContent = calculateEvaluationGrade(student, 1);
            detailEval2.textContent = calculateEvaluationGrade(student, 2);
            // NUEVO: Actualizar valores de 3ª Evaluación y Nota Final de Curso
            detailEval3.textContent = calculateEvaluationGrade(student, 3);
            detailFinalCourse.textContent = calculateFinalCourseGrade(student);
            
            renderStudentGradesInDetail(student);
            studentDetailModal.classList.add('active');
        } else {
            console.error('No se encontró el estudiante con ID:', studentId);
            studentDetailModal.classList.remove('active');
            currentStudentId = null;
        }
    }


    // --- Manejadores de Eventos ---

    courseSelector.addEventListener('change', (event) => {
        currentCourse = event.target.value;
        currentClass = null; 
        updateClassSelector();
        renderCurrentClassStudents(); 
    });

    classSelector.addEventListener('change', (event) => {
        currentClass = event.target.value;
        renderCurrentClassStudents();
    });

    addClassBtn.addEventListener('click', () => {
        addClassModal.classList.add('active');
        if (currentCourse) {
            newClassCourseSelector.value = currentCourse;
        }
        newClassNameInput.focus();
    });

    saveClassBtn.addEventListener('click', () => {
        const course = newClassCourseSelector.value;
        const className = newClassNameInput.value.trim();

        if (course && className) {
            if (!appData[course]) {
                appData[course] = {};
            }
            const classId = className.toLowerCase().replace(/\s+/g, '-');
            if (appData[course][classId]) {
                alert('Ya existe una clase con ese nombre en este curso.');
                return;
            }

            appData[course][classId] = {
                name: className,
                students: []
            };
            saveAppData();

            currentCourse = course;
            currentClass = classId;
            courseSelector.value = currentCourse;
            updateClassSelector();
            renderCurrentClassStudents();

            addClassModal.classList.remove('active');
            newClassNameInput.value = '';
            newClassCourseSelector.value = '';
        } else {
            alert('Por favor, selecciona un curso e ingresa el nombre de la clase.');
        }
    });

    addStudentBtn.addEventListener('click', () => {
        if (currentCourse && currentClass) {
            addStudentModal.classList.add('active');
            newStudentNameInput.focus();
        } else {
            alert('Por favor, selecciona un curso y una clase primero.');
        }
    });

    saveStudentBtn.addEventListener('click', () => {
        const name = newStudentNameInput.value.trim();
        if (name && currentCourse && currentClass) {
            const studentsInClass = appData[currentCourse][currentClass].students;
            const newStudent = {
                id: Date.now(),
                name: name,
                positives: 0,
                negatives: 0,
                grades: [] 
            };
            studentsInClass.push(newStudent);
            saveAppData();
            renderCurrentClassStudents();
            addStudentModal.classList.remove('active');
            newStudentNameInput.value = '';
        } else if (!name) {
            alert('Por favor, ingresa el nombre del alumno.');
        } else {
            alert('No se ha seleccionado ninguna clase. No se puede añadir el alumno.');
        }
    });

    addGradeBtn.addEventListener('click', () => {
        gradeModalTitle.textContent = 'Añadir Nuevo Grado';
        editingGradeId = null; 
        gradeNumberInput.value = '';
        gradeNameInput.value = '';
        gradeClassworkInput.value = '0';
        gradeBehaviorInput.value = '0';
        gradeGoetheInput.value = '0';
        gradeExamInput.value = '0';
        gradeModal.classList.add('active');
    });

    saveGradeBtn.addEventListener('click', () => {
        const gradeNumber = parseInt(gradeNumberInput.value);
        const gradeName = gradeNameInput.value.trim();
        const gradeClasswork = parseFloat(gradeClassworkInput.value);
        const gradeBehavior = parseFloat(gradeBehaviorInput.value);
        const gradeGoethe = parseFloat(gradeGoetheInput.value);
        const gradeExam = parseFloat(gradeExamInput.value);

        if (isNaN(gradeNumber) || gradeNumber < 1) {
            alert('El número de grado debe ser un número entero positivo.');
            return;
        }

        const student = getStudentById(currentStudentId);
        if (!student) {
            alert('Error: No se encontró el alumno actual para guardar el grado.');
            return;
        }

        const existingGradeWithSameNumber = student.grades.find(g => 
            g.number === gradeNumber && g.id !== editingGradeId
        );
        if (existingGradeWithSameNumber) {
            alert(`Ya existe un grado con el número ${gradeNumber} para este alumno.`);
            return;
        }

        const validateGradeValue = (value) => !isNaN(value) && value >= 0 && value <= 10;
        if (!validateGradeValue(gradeClasswork) || !validateGradeValue(gradeBehavior) || 
            !validateGradeValue(gradeGoethe) || !validateGradeValue(gradeExam)) {
            alert('Todas las notas deben estar entre 0 y 10.');
            return;
        }


        if (editingGradeId) {
            const gradeToUpdate = student.grades.find(g => g.id === editingGradeId);
            if (gradeToUpdate) {
                gradeToUpdate.number = gradeNumber;
                gradeToUpdate.name = gradeName;
                gradeToUpdate.classwork = gradeClasswork;
                gradeToUpdate.behavior = gradeBehavior;
                gradeToUpdate.goethe = gradeGoethe;
                gradeToUpdate.exam = gradeExam;
            }
        } else {
            student.grades.push({
                id: Date.now(), 
                number: gradeNumber,
                name: gradeName,
                classwork: gradeClasswork,
                behavior: gradeBehavior,
                goethe: gradeGoethe,
                exam: gradeExam
            });
        }

        saveAppData();
        openStudentDetailModal(currentStudentId); 
        renderCurrentClassStudents(); 
        gradeModal.classList.remove('active'); 
        editingGradeId = null; 
    });

    gradesTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const row = target.closest('tr');
        if (!row) return;

        const studentId = parseInt(row.dataset.id);
        const student = getStudentById(studentId);
        if (!student) {
            console.error("Estudiante no encontrado para la fila clicada:", studentId);
            return;
        }

        if (target.classList.contains('student-name-link')) {
            event.preventDefault(); 
            openStudentDetailModal(studentId);
            return;
        }

        const action = target.dataset.action;
        let studentDataChanged = false; 

        if (action === 'increment-positive') {
            student.positives++;
            studentDataChanged = true;
        } else if (action === 'decrement-positive') {
            if (student.positives > 0) student.positives--;
            studentDataChanged = true;
        } else if (action === 'increment-negative') {
            student.negatives++;
            studentDataChanged = true;
        } else if (action === 'decrement-negative') {
            if (student.negatives > 0) student.negatives--;
            studentDataChanged = true;
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`¿Estás seguro de que quieres eliminar a ${student.name} y todos sus grados?`)) {
                appData[currentCourse][currentClass].students = appData[currentCourse][currentClass].students.filter(s => s.id !== studentId);
                studentDataChanged = true; 
            }
        }

        saveAppData();
        renderCurrentClassStudents(); 

        if (studentDetailModal.classList.contains('active') && currentStudentId === studentId && studentDataChanged) {
            openStudentDetailModal(studentId); 
        }
    });

    gradesContainer.addEventListener('click', (event) => {
        const target = event.target;
        const gradeCard = target.closest('.grade-card');
        if (!gradeCard) return;

        const gradeId = parseInt(gradeCard.dataset.gradeId);
        const student = getStudentById(currentStudentId); 
        if (!student) {
            console.error("Estudiante no encontrado al intentar editar/eliminar grado.");
            return;
        }

        if (target.classList.contains('edit-grade-btn')) {
            const gradeToEdit = student.grades.find(g => g.id === gradeId);
            if (gradeToEdit) {
                gradeModalTitle.textContent = `Editar Grado ${gradeToEdit.number} ${gradeToEdit.name ? `(${gradeToEdit.name})` : ''}`;
                editingGradeId = gradeId;
                gradeNumberInput.value = gradeToEdit.number;
                gradeNameInput.value = gradeToEdit.name;
                gradeClassworkInput.value = gradeToEdit.classwork.toFixed(2);
                gradeBehaviorInput.value = gradeToEdit.behavior.toFixed(2);
                gradeGoetheInput.value = gradeToEdit.goethe.toFixed(2);
                gradeExamInput.value = gradeToEdit.exam.toFixed(2);
                gradeModal.classList.add('active');
            }
        } else if (target.classList.contains('delete-grade-btn')) {
            if (confirm(`¿Estás seguro de que quieres eliminar este grado del alumno ${student.name}?`)) {
                student.grades = student.grades.filter(g => g.id !== gradeId);
                saveAppData();
                openStudentDetailModal(currentStudentId); 
                renderCurrentClassStudents(); 
            }
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === addClassModal) {
            addClassModal.classList.remove('active');
            newClassNameInput.value = '';
            newClassCourseSelector.value = '';
        }
        if (event.target === addStudentModal) {
            addStudentModal.classList.remove('active');
            newStudentNameInput.value = '';
        }
        if (event.target === studentDetailModal) {
            studentDetailModal.classList.remove('active');
            currentStudentId = null; 
        }
        if (event.target === gradeModal) {
            gradeModal.classList.remove('active');
            gradeNumberInput.value = '';
            gradeNameInput.value = '';
            gradeClassworkInput.value = '0';
            gradeBehaviorInput.value = '0';
            gradeGoetheInput.value = '0';
            gradeExamInput.value = '0';
            editingGradeId = null; 
        }
    });

    // --- FUNCIONALIDAD: EXPORTAR A EXCEL (CSV) ---
    if (exportStudentsBtn) { 
        exportStudentsBtn.addEventListener('click', () => {
            if (!currentCourse || !currentClass) {
                alert('Por favor, selecciona un curso y una clase para exportar.');
                return;
            }

            const studentsInClass = appData[currentCourse][currentClass].students;
            if (studentsInClass.length === 0) {
                alert('No hay alumnos en la clase actual para exportar.');
                return;
            }

            let csvContent = '';
            const header = [
                'Nombre Alumno',
                'Positivos',
                'Negativos',
                'Nota Final Global',
                'Nota 1ra Evaluacion',
                'Nota 2da Evaluacion',
                'Nota 3ra Evaluacion (Grado 12)', // NUEVA COLUMNA EN EL CSV
                'Nota Final Curso' // NUEVA COLUMNA EN EL CSV
            ];
            
            let maxGrades = 0;
            studentsInClass.forEach(student => {
                if (student.grades && student.grades.length > maxGrades) {
                    maxGrades = student.grades.length;
                }
            });

            for (let i = 1; i <= maxGrades; i++) {
                header.push(`Grado ${i}: Nota Final Ajustada`);
                header.push(`Grado ${i}: Nombre`);
                header.push(`Grado ${i}: Trabajo Clase`);
                header.push(`Grado ${i}: Comportamiento`);
                header.push(`Grado ${i}: Goethe`);
                header.push(`Grado ${i}: Examen`);
            }
            csvContent += header.join(';') + '\n'; 

            studentsInClass.forEach(student => {
                let rowData = [
                    `"${student.name}"`, 
                    student.positives,
                    student.negatives,
                    calculateStudentFinalGlobalGrade(student),
                    calculateEvaluationGrade(student, 1),
                    calculateEvaluationGrade(student, 2),
                    calculateEvaluationGrade(student, 3), // Dato de la 3ª Evaluación
                    calculateFinalCourseGrade(student) // Dato de la Nota Final de Curso
                ];

                const sortedGrades = student.grades ? [...student.grades].sort((a, b) => a.number - b.number) : [];

                for (let i = 0; i < maxGrades; i++) {
                    const grade = sortedGrades[i];
                    if (grade) {
                        const finalScore = calculateGradeFinalScore(grade, student); 
                        rowData.push(finalScore.toFixed(2));
                        rowData.push(`"${grade.name || ''}"`);
                        rowData.push(parseFloat(grade.classwork).toFixed(2));
                        rowData.push(parseFloat(grade.behavior).toFixed(2));
                        rowData.push(parseFloat(grade.goethe).toFixed(2));
                        rowData.push(parseFloat(grade.exam).toFixed(2));
                    } else {
                        rowData.push('', '', '', '', '', ''); 
                    }
                }
                csvContent += rowData.join(';') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `alumnos-${currentCourse}-${currentClass}-${new Date().toISOString().slice(0,10)}.csv`; 
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a); 
            URL.revokeObjectURL(url); 
        });
    }


    // --- Inicialización al cargar la página ---
    const lastCourse = localStorage.getItem('lastSelectedCourse');
    const lastClass = localStorage.getItem('lastSelectedClass');

    if (lastCourse && appData[lastCourse]) {
        currentCourse = lastCourse;
        courseSelector.value = lastCourse;
        updateClassSelector(); 
        if (lastClass && appData[lastCourse][lastClass]) {
            currentClass = lastClass;
            classSelector.value = lastClass;
        }
    }
    
    courseSelector.addEventListener('change', () => {
        localStorage.setItem('lastSelectedCourse', courseSelector.value);
        localStorage.removeItem('lastSelectedClass'); 
        if (exportStudentsBtn) exportStudentsBtn.disabled = true; 
    });
    classSelector.addEventListener('change', () => {
        localStorage.setItem('lastSelectedClass', classSelector.value);
        if (exportStudentsBtn) {
            exportStudentsBtn.disabled = !classSelector.value || (appData[currentCourse][classSelector.value].students.length === 0);
        }
    });

    renderCurrentClassStudents(); 
    if (exportStudentsBtn) {
        exportStudentsBtn.disabled = !currentClass || (currentClass && appData[currentCourse][currentClass].students.length === 0);
    }
});

