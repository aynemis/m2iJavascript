$(document).ready(function () {
    if (localStorage.getItem("isLoggedIn") == "true") {
        window.location.href = "../home/index.html";
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
            url: 'http://localhost:3000/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            success: function (response) {
                $('#confirmationMessage').show();
                $('#registrationForm')[0].reset();
                window.location.href = '../signin/index.html';
            },
            error: function (error) {
                console.error("Erreur lors de la création du compte :", error);
                alert("Erreur lors de la création du compte. Veuillez réessayer.");
            }
        });
    });
});
