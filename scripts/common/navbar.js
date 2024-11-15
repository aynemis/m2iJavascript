export function loadNavbar() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    document.getElementById("navbar").innerHTML = `
       <nav class="navbar navbar-expand-lg navbar-custom shadow-sm" style="background-color: #006400;">
            <div class="container-fluid">
                <a class="navbar-brand font-weight-bold text-uppercase d-flex align-items-center" href="../views/index.html" style="font-size: 1.8rem; color: #d4edda;">
                    <span style="color: #ffffff;">Insta</span><span style="color: #d4edda;">Bank</span>
                </a>
                <button class="navbar-toggler border-0" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon text-light"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul id="navItems" class="navbar-nav align-items-center">
                        <li class="nav-item mx-3">
                            <a class="nav-link text-light font-weight-bold" href="../views/home.html" style="transition: color 0.3s ease;">Accueil</a>
                        </li>
                        <li class="nav-item mx-3">
                            <a class="nav-link text-light font-weight-bold" href="../views/transfers.html" style="transition: color 0.3s ease;">Historique</a>
                        </li>
                        <li class="nav-item mx-3">
                            <a class="nav-link text-light font-weight-bold" href="../views/user.html" style="transition: color 0.3s ease;">Profil</a>
                        </li>
                    </ul>
                    <div class="ml-auto">
                        <button id="loginButton" class="btn btn-rounded text-light font-weight-bold px-4 py-2 shadow" style="border-radius: 20px; transition: all 0.3s ease;"></button>
                    </div>
                </div>
            </div>
       </nav>
    `;

    // Hide buttons if not logged in
    if (!isLoggedIn) {
        document.getElementById('navItems').style.display = 'none';
    }

    updateLoginButton();
}

function updateLoginButton() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');

    const loginButton = $('#loginButton');

    if (isLoggedIn && username) {
        loginButton.text('Déconnexion');
        loginButton.css({ backgroundColor: '#dc3545', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' });
    } else {
        loginButton.text('Connexion');
        loginButton.css({ backgroundColor: '#28a745', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' });
    }

    loginButton.on('mouseenter', function () {
        $(this).css({ transform: 'scale(1.05)', boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)' });
    }).on('mouseleave', function () {
        $(this).css({ transform: 'scale(1)', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' });
    });

    loginButton.on('click', function () {
        if ($(this).text() === 'Connexion') {
            window.location.href = '../views/signin.html';
        } else {
            loginButton.text('Connexion');
            loginButton.css({ backgroundColor: '#28a745' });
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            window.location.href = '../views/signin.html';
        }
    });
}
