$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
    $('.container').css('display', 'block');
    loadLoginHistory();
});

// Fonction pour nettoyer les données utilisateur et éviter les attaques XSS
const sanitizeInput = (input) =>  DOMPurify.sanitize(input);// Échappe les caractères spéciaux

function loadLoginHistory() {
    const userId = sanitizeInput(localStorage.getItem('userId')); // Nettoyage ajouté

    $.ajax({
        url: `http://localhost:8000/loginHistory?userId=${userId}`, // Nettoyage ajouté
        type: 'GET',
        success: function (logins) {
            displayLoginHistory(logins);
            checkForSuspiciousLogins(logins);
        },
        error: function (error) {
            console.error("Erreur lors du chargement de l'historique de connexion :", error);
            showErrorMessage("Erreur lors du chargement de votre historique de connexion. Veuillez réessayer.");
        }
    });
}

function displayLoginHistory(logins) {
    const loginHistoryTableBody = $('#loginHistoryTableBody');
    loginHistoryTableBody.empty();

    if (logins.length === 0) {
        loginHistoryTableBody.append('<tr><td colspan="3" class="text-center">Aucune connexion trouvée.</td></tr>');
    } else {
        logins.forEach(login => {
            const date = sanitizeInput(new Date(login.date).toLocaleString()); // Nettoyage ajouté
            const ipAddress = sanitizeInput(login.ipAddress); // Nettoyage ajouté
            const location = sanitizeInput(login.location); // Nettoyage ajouté

            const row = `<tr>
                <td>${date}</td>
                <td>${ipAddress}</td>
                <td>${location}</td>
            </tr>`;
            loginHistoryTableBody.append(row);
        });
    }
}

function checkForSuspiciousLogins(logins) {
    if (logins.length < 2) return;
    const lastLogin = logins[logins.length - 1];
    const secondLastLogin = logins[logins.length - 2];

    // Comparer les données déjà nettoyées dans `displayLoginHistory`
    if (sanitizeInput(lastLogin.location) === sanitizeInput(secondLastLogin.location)) {
        $('#alertMessage').hide();
    }
}

function showErrorMessage(message) {
    const sanitizedMessage = sanitizeInput(message); // Nettoyage ajouté
    $('#errorMessage').text(sanitizedMessage).fadeIn();
    setTimeout(function () {
        $('#errorMessage').fadeOut();
    }, 5000);
}
