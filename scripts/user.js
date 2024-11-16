  

$( document ).ready( function (){
    if (localStorage.getItem( 'isLoggedIn' ) === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
    loadUserInfo();

    $( '.container' ).css( 'display', 'block' );

    $('#profileForm').on('submit', function (event) {
        event.preventDefault();
        updateUserProfile();
    });

    $('#deleteAccountButton').on('click', function () {
        deleteUserAccount();
    });
});
const sanitizeInput = (input) => DOMPurify.sanitize(input);
function loadUserInfo() {
    const username = sanitizeInput(localStorage.getItem('username'));  // Sanitisation applied

    $.ajax({
        url: 'http://localhost:8000/users',
        type: 'GET',
        success: function (users) {
            const user = users.find(u => sanitizeInput(u.name) === username);  // Sanitisation applied on user.name
            if (user) {
                populateProfileForm(user);
            } else {
                window.location.href = '../views/signin.html';
            }
        },
        error: function (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            alert("Erreur lors de la récupération de l'utilisateur. Veuillez réessayer.");
        }
    });
}

function populateProfileForm(user) {
    $('#userName').val(sanitizeInput(user.name));  // Sanitisation applied
    $('#userEmail').val(sanitizeInput(user.email));  // Sanitisation applied
    $('#alertThreshold').val(user.alertThreshold || '');
}
function updateUserProfile() {
    const userId = sanitizeInput(localStorage.getItem('userId'));  
    const updatedName = sanitizeInput($('#userName').val().trim());  // Sanitisation applied
    const updatedEmail = sanitizeInput($('#userEmail').val().trim());  // Sanitisation applied
    const alertThresholdStr = $('#alertThreshold').val().trim(); // Get alert threshold as string

    // Convert alert threshold to null if it's empty, otherwise parse it as a number
    const alertThreshold = alertThresholdStr === "" ? null : parseFloat(alertThresholdStr);

    if (updatedName === "" || updatedEmail === "" || 
        (alertThresholdStr !== "" && (isNaN(alertThreshold) || alertThreshold < 0))) {
        showErrorMessage("Veuillez remplir tous les champs avec des valeurs valides.");
        return;
    }

    $.ajax({
        url: `http://localhost:8000/users/${userId}`, 
        type: 'GET',
        success: function (user) {
            if (!user) {
                console.error("Utilisateur non trouvé.");
                showErrorMessage("Utilisateur non trouvé.");
                return;
            }

            const updatedUser = {
                ...user,
                name: updatedName,
                email: updatedEmail,
                alertThreshold: alertThreshold 
            };

            $.ajax({
                url: `http://localhost:8000/users/${user.id}`,  
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updatedUser),
                success: function () {
                    if (user.name !== updatedName) {
                        localStorage.setItem('username', updatedName); 
                    }
                    showSuccessMessage("Informations mises à jour avec succès !");
                },
                error: function (error) {
                    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
                    showErrorMessage("Erreur lors de la mise à jour des informations. Veuillez réessayer.");
                }
            });
        },
        error: function (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            showErrorMessage("Erreur lors de la récupération de l'utilisateur. Veuillez réessayer.");
        }
    });
}

function deleteUserAccount() {
    const userId = sanitizeInput(localStorage.getItem('userId'));  // Sanitise userId

    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.");

    if (!confirmation) {
        return; 
    }

    $.ajax({
        url: `http://localhost:8000/users/${encodeURIComponent(userId)}`,  
        type: 'DELETE',
        success: function () {
            showSuccessMessage("Votre compte a été supprimé avec succès.");
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('userId'); 
            window.location.href = '../views/signin.html'; 
        },
        error: function (error) {
            console.error("Erreur lors de la suppression de l'utilisateur :", error);
            showErrorMessage("Erreur lors de la suppression de votre compte. Veuillez réessayer.");
        }
    });
}

function showErrorMessage(message) {
    $('#errorMessage').text(message).fadeIn();
    setTimeout(function () {
        $('#errorMessage').fadeOut();
    }, 2000);
}

function showSuccessMessage(message) {
    $('#successMessage').text(message).fadeIn();
    setTimeout(function () {
        $('#successMessage').fadeOut();
    }, 2000);
}
