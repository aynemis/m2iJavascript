$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
    $('.container').css('display', 'block');
    loadUserInfo();
});

const userId = localStorage.getItem('userId');

// Fonction pour nettoyer les entrées utilisateur et éviter les attaques XSS 
const sanitizeInput = (input) => DOMPurify.sanitize(input);

function loadUserInfo() {
    $.ajax({
        url: `http://localhost:8000/users/${sanitizeInput(userId)}`, // Nettoyage ajouté
        type: 'GET',
        success: function (user) {
            if (!user) {
                window.location.href = '../templates/views/signin.html';
                return;
            }
            console.log(user);
            const sanitizedName = sanitizeInput(user.name); // Nettoyage ajouté
            $('#welcomeMessage').text(`Bienvenue ${sanitizedName}`);
            fetchAccountsForUser(user.id, user.alertThreshold);
        },
        error: function (error) {
            console.error("Erreur lors de la récupération de l'utilisateur :", error);
            alert("Erreur lors de la récupération de l'utilisateur.");
            window.location.href = '../templates/views/signin.html';
        }
    });
}

function fetchAccountsForUser(userId, alertThreshold) {
    $.ajax({
        url: `http://localhost:8000/accounts?userId=${sanitizeInput(userId)}`, // Nettoyage ajouté
        type: 'GET',
        success: function (accounts) {
            const sanitizedAccounts = accounts.map(account => ({
                ...account,
                name: sanitizeInput(account.name), // Nettoyage ajouté
            }));
            const courantAccounts = sanitizedAccounts.filter(account => account.type === 'Courant');
            displayAccounts(sanitizedAccounts, alertThreshold);

            if (courantAccounts.length > 0) {
                fetchUserTransactions(userId, courantAccounts);
            }
        },
        error: function (error) {
            console.error("Erreur lors du chargement des comptes :", error);
            alert("Erreur lors du chargement des comptes.");
        }
    });
}

function displayAccounts(accounts, alertThreshold) {
    const accountsTableBody = $('#accountsTableBody');
    accountsTableBody.empty();

    let totalBalance = 0;

    if (accounts.length === 0) {
        accountsTableBody.append('<tr><td colspan="2" class="text-center">Aucun compte trouvé.</td></tr>');
    } else {
        accounts.forEach(account => {
            totalBalance += account.balance;
            const isLowBalance = alertThreshold !== undefined && account.balance < alertThreshold;
            const balanceClass = isLowBalance ? 'low-balance' : '';

            const row = `<tr>
                <td>${account.name}</td> <!-- Les noms des comptes sont déjà nettoyés -->
                <td class="${balanceClass}">${account.balance.toFixed(2)} €</td>
            </tr>`;
            accountsTableBody.append(row);
        });
    }

    const isTotalLow = alertThreshold !== undefined && totalBalance < alertThreshold;
    const totalBalanceClass = isTotalLow ? 'low-balance' : '';

    $('#totalBalance').text(`Solde Total: ${totalBalance.toFixed(2)}€`).attr('class', `text-center mt-3 ${totalBalanceClass}`);
}

function fetchUserTransactions(userId, courantAccounts) {
    $.ajax({
        url: `http://localhost:8000/transactions`,
        type: 'GET',
        success: function (transactions) {
            const accountIds = courantAccounts.map(account => account.id);
            const sanitizedTransactions = transactions.map(transaction => ({
                ...transaction,
                senderBalanceAfter: sanitizeInput(transaction.senderBalanceAfter.toString()), // Nettoyage ajouté
                recipientBalanceAfter: sanitizeInput(transaction.recipientBalanceAfter.toString()), // Nettoyage ajouté
            }));
            const userTransactions = sanitizedTransactions.filter(transaction =>
                (transaction.fromUserId === userId && accountIds.includes(transaction.fromAccountId)) ||
                (transaction.toUserId === userId && accountIds.includes(transaction.toAccountId))
            );
            displayBalanceHistoryChart(userTransactions, userId, courantAccounts);
        },
        error: function (error) {
            console.error("Erreur lors de la récupération des transactions :", error);
            alert("Erreur lors de la récupération des transactions.");
        }
    });
}

function displayBalanceHistoryChart(transactions, userId, courantAccounts) {
    let balanceChartContainer = document.getElementById('balanceHistoryChart');
    if (!balanceChartContainer) {
        balanceChartContainer = document.createElement('canvas');
        balanceChartContainer.id = 'balanceHistoryChart';
        balanceChartContainer.width = 900;
        balanceChartContainer.height = 400;
        document.querySelector('.content-container').appendChild(balanceChartContainer);
    }

    const labels = [];
    const data = [];

    transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString('fr-FR');
        let balance;

        if (transaction.fromUserId === userId && courantAccounts.some(account => account.id === transaction.fromAccountId)) {
            balance = transaction.senderBalanceAfter;
        } else if (transaction.toUserId === userId && courantAccounts.some(account => account.id === transaction.toAccountId)) {
            balance = transaction.recipientBalanceAfter;
        } else {
            return;
        }

        labels.push(sanitizeInput(date)); // Nettoyage ajouté
        data.push(parseFloat(balance)); // Assurez-vous que les valeurs restent des nombres
    });

    if (window.myLineChart) {
        window.myLineChart.destroy();
    }

    const ctx = balanceChartContainer.getContext('2d');
    window.myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Historique du compte courant',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Solde (€)'
                    }
                }
            }
        }
    });
}
