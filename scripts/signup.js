$(document).ready(function () {
    if (localStorage.getItem("isLoggedIn") == "true") {
        window.location.href = "../../views/home.html";
    }
    $('.container').css('display', 'block');

    $('#registrationForm').on('submit', function (event) {
        event.preventDefault();

        $('#confirmationMessage').hide();
        $('.form-control').removeClass('is-invalid');

        const name = $('#name').val();
        const email = $('#email').val();
        const password = $('#password').val();

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

                // Parse and display the error message from the response
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.detail : "An unknown error occurred.";
                alert("Error: " + errorMessage);

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
