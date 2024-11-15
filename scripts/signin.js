$(document).ready(function () {
    if (localStorage.getItem("isLoggedIn") == "true") {
        window.location.href = "../views/home.html";
    }
    $('.container').css('display', 'block');

    function fetchIPAndLocation(callback) {
        $.ajax({
            url: 'http://localhost:8000/get-ip-location',  // Calling FastAPI endpoint
            type: 'GET',
            success: function (data) {
                if (data.error) {
                    console.error(data);
                    alert("Unable to retrieve IP and location.");
                    callback(null, null);
                } else {
                    const ipAddress = data.ip;
                    const location = `${data.city}, ${data.country}`;
                    callback(ipAddress, location);
                }
            },
            error: function (error) {
                console.error("Error fetching IP location:", error);
                alert("Error fetching IP location.");
                callback(null, null);
            }
        });
    }    

    $('#loginForm').on('submit', function (event) {
        event.preventDefault();
    
        const email = $('#email').val();
        const password = $('#password').val();
    
        $.ajax({
            url: 'http://localhost:8000/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email, password: password }),
            success: function (response) {
                fetchIPAndLocation(function (ipAddress, location) {
                    if (ipAddress && location) {
                        $.ajax({
                            url: 'http://localhost:8000/loginHistory',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                userId: response.userId,
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
                    localStorage.setItem('username', response.name);
                    localStorage.setItem('userId', response.userId);
                    window.location.href = '../views/home.html';
                });
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.detail : "Erreur lors de la connexion. Veuillez réessayer.";
                console.error("Erreur lors de la vérification des informations :", errorMessage);
                alert(errorMessage);  
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
            url: 'http://localhost:8000/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            success: function (response) {
                $('#confirmationMessage').show();
                $('#registrationForm')[0].reset();

                localStorage.setItem('username', name);
                localStorage.setItem('isLoggedIn', 'true');

                window.location.href = '../../views/home.html';
            },
            error: function (error) {
                console.error("Erreur lors de la création du compte :", error);
                alert("Erreur lors de la création du compte. Veuillez réessayer.");
            }
        });
    });
});
