$(document).ready(function () {
    if (localStorage.getItem("isLoggedIn") == "true") {
        window.location.href = "../home/index.html";
    }
    $('.container').css('display', 'block');

    function fetchIPAndLocation(callback) {
        $.ajax({
            url: 'https://ipwhois.app/json/',
            type: 'GET',
            success: function (data) {
                const ipAddress = data.ip;
                const location = `${data.city}, ${data.country}`;
                callback(ipAddress, location);
            },
            error: function (error) {
                console.error("Erreur lors de la récupération de l'adresse IP et de la localisation :", error);
                alert("Impossible de récupérer l'adresse IP et la localisation.");
                callback(null, null);
            }
        });
    }

    $('#loginForm').on('submit', function (event) {
        event.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();

        $.ajax({
            url: 'http://localhost:3000/users',
            type: 'GET',
            success: function (users) {
                const user = users.find(u => u.email === email && u.password === password);

                if (user) {
                    fetchIPAndLocation(function (ipAddress, location) {
                        if (ipAddress && location) {
                            $.ajax({
                                url: 'http://localhost:3000/loginHistory',
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify({
                                    userId: user.id,
                                    date: new Date().toISOString(),
                                    ipAddress: ipAddress,
                                    location: location
                                }),
                                success: function () {
                                    console.log("Historique de connexion enregistré.");
                                },
                                error: function (error) {
                                    console.error("Erreur lors de l'enregistrement de l'historique :", error);
                                }
                            });
                        } else {
                            alert("Impossible de récupérer l'adresse IP et la localisation.");
                        }

                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('username', user.name);
                        localStorage.setItem('userId', user.id);
                        window.location.href = '../home/index.html';
                    });
                } else {
                    $('#errorMessage').show();
                }
            },
            error: function (error) {
                console.error("Erreur lors de la vérification des informations :", error);
                alert("Erreur lors de la connexion. Veuillez réessayer.");
            }
        });
    });

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

                localStorage.setItem('username', name);
                localStorage.setItem('isLoggedIn', 'true');

                window.location.href = '../home/index.html';
            },
            error: function (error) {
                console.error("Erreur lors de la création du compte :", error);
                alert("Erreur lors de la création du compte. Veuillez réessayer.");
            }
        });
    });
});
