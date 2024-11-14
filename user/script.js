  

$( document ).ready( function (){
    if (localStorage.getItem( 'isLoggedIn' ) === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../signin/index.html';
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
        url: 'http://localhost:3000/users',
        type: 'GET',
        success: function (users) {
            const user = users.find(u => u.name === username);
            if (user) {
                populateProfileForm(user);
            } else {
                console.error("Utilisateur non trouvé.");
                alert("Utilisateur non trouvé.");
                window.location.href = '../signin/index.html';
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
    const username = localStorage.getItem('username');

    const updatedName = $('#userName').val().trim();
    const updatedEmail = $('#userEmail').val().trim();
    const alertThreshold = parseFloat($('#alertThreshold').val());

    if (updatedName === "" || updatedEmail === "" || isNaN(alertThreshold) || alertThreshold <= 0) {
        showErrorMessage("Veuillez remplir tous les champs avec des valeurs valides.");
        return;
    }

    $.ajax({
        url: `http://localhost:3000/users?name=${encodeURIComponent(username)}`,
        type: 'GET',
        success: function (users) {
            if (users.length === 0) {
                console.error("Utilisateur non trouvé.");
                showErrorMessage("Utilisateur non trouvé.");
                return;
            }

            const user = users[0]; 

            const updatedUser = {
                ...user,
                name: updatedName,
                email: updatedEmail,
                alertThreshold: alertThreshold
            };

            $.ajax({
                url: `http://localhost:3000/users/${user.id}`,
                type: 'PUT', 
                contentType: 'application/json',
                data: JSON.stringify(updatedUser),
                success: function () {
                    if (username !== updatedName) {
                        localStorage.setItem('username', updatedName);
                    }

                    showSuccessMessage("Informations mises à jour avec succès !");
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
    const username = localStorage.getItem('username');

    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.");

    if (!confirmation) {
        return; 
    }


    $.ajax({
        url: `http://localhost:3000/users?name=${encodeURIComponent(username)}`,
        type: 'GET',
        success: function (users) {
            if (users.length === 0) {
                console.error("Utilisateur non trouvé.");
                showErrorMessage("Utilisateur non trouvé.");
                return;
            }

            const user = users[0]; 

            $.ajax({
                url: `http://localhost:3000/users/${user.id}`,
                type: 'DELETE',
                success: function () {
                    showSuccessMessage("Votre compte a été supprimé avec succès.");
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('username');
                    window.location.href = '../signin/index.html';
                },
                error: function (error) {
                    console.error("Erreur lors de la suppression de l'utilisateur :", error);
                    showErrorMessage("Erreur lors de la suppression de votre compte. Veuillez réessayer.");
                }
            });
        },
        error: function (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            showErrorMessage("Erreur lors de la récupération de l'utilisateur. Veuillez réessayer.");
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