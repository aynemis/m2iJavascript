$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
     $('.container').css('display', 'block');
    loadLoginHistory();
});

function loadLoginHistory() {
    const userId = localStorage.getItem('userId');

    $.ajax({
        url: `http://localhost:3000/loginHistory?userId=${userId}`,
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
            const date = new Date(login.date).toLocaleString();
            const row = `<tr>
                <td>${date}</td>
                <td>${login.ipAddress}</td>
                <td>${login.location}</td>
            </tr>`;
            loginHistoryTableBody.append(row);
        })
    }
}

function checkForSuspiciousLogins(logins) {
    if (logins.length < 2) return;
    const lastLogin = logins[logins.length - 1];
    const secondLastLogin = logins[logins.length - 2];

    if (lastLogin.location === secondLastLogin.location) {
        $('#alertMessage').hide();
    }
}

function showErrorMessage(message) {
    $('#errorMessage').text(message).fadeIn();
    setTimeout(function () {
        $('#errorMessage').fadeOut();
    }, 5000);
}
