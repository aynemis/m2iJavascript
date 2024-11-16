$(document).ready(function () {
    if (localStorage.getItem("isLoggedIn") == "true") {
        window.location.href = "../../views/home.html";
    }
    $('.container').css('display', 'block');

    // Fonction pour nettoyer les entrées utilisateur et éviter les attaques XSS
const sanitizeInput = (input) => DOMPurify.sanitize(input);

    $('#registrationForm').on('submit', function (event) {
        event.preventDefault();

        $('#confirmationMessage').hide();
        $('.form-control').removeClass('is-invalid');

        // Sanitize les entrées utilisateur pour éviter les XSS
        const name = sanitizeInput($('#name').val()); // Nettoyage ajouté
        const email = sanitizeInput($('#email').val()); // Nettoyage ajouté
        const password = $('#password').val(); // Pas de sanitization nécessaire pour les mots de passe

        if (password.length < 8) {
            $('#password').addClass('is-invalid');
            return;
        }

        const userData = {
            name: name,
            email: email,
            password: password
        };

        $.ajax({
            url: 'http://localhost:8000/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            success: function (response) {
                $('#confirmationMessage').show();
                $('#registrationForm')[0].reset();
                window.location.href = '../views/signin.html';
            },
            error: function (xhr, status, error) {
                console.error("Error during account creation:", error);

                // Parse et sanitize les messages d'erreur retournés par l'API
                const errorMessage = xhr.responseJSON 
                    ? sanitizeInput(xhr.responseJSON.detail)  // Nettoyage ajouté
                    : "An unknown error occurred.";
                alert("Error: " + errorMessage); // Message sécurisé

                // Highlight the invalid field
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    const errorDetail = xhr.responseJSON.detail;
                    if (errorDetail.includes("Cet email est déjà utilisé")) {
                        $('#email').addClass('is-invalid');
                    }
                    if (errorDetail.includes("Mot de passe")) {
                        $('#password').addClass('is-invalid');
                    }
                }
            }
        });
    });
});
