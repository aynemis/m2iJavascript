  

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


function loadUserInfo() {
    const username = localStorage.getItem('username');

    $.ajax({
        url: 'http://localhost:8000/users',
        type: 'GET',
        success: function (users) {
            const user = users.find(u => u.name === username);
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
    $('#userName').val(user.name);
    $('#userEmail').val(user.email);
    $('#alertThreshold').val(user.alertThreshold || '');
}


function updateUserProfile() {
    const userId = localStorage.getItem('userId');  
    const updatedName = $('#userName').val().trim(); 
    const updatedEmail = $('#userEmail').val().trim(); 
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
    const userId = localStorage.getItem('userId');  

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