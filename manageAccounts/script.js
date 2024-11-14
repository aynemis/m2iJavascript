$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../signin/index.html';
    }
    $('.container').css('display', 'block');
    loadExistingAccounts();

    $('#addAccountForm').on('submit', function (e) {
        e.preventDefault();
        addNewAccount();
    });
});

const userId = localStorage.getItem('userId');

function loadExistingAccounts() {
    $.ajax({
        url: `http://localhost:3000/accounts?userId=${userId}`,
        type: 'GET',
        success: function (accounts) {
            displayExistingAccounts(accounts);
        },
        error: function (error) {
            console.error("Erreur lors du chargement des comptes :", error);
            showErrorMessage("Erreur lors du chargement de vos comptes. Veuillez réessayer.");
        }
    });
}

function displayExistingAccounts(accounts) {
    const existingAccountsTableBody = $('#existingAccountsTableBody');
    existingAccountsTableBody.empty();

    if (accounts.length === 0) {
        existingAccountsTableBody.append('<tr><td colspan="4" class="text-center">Aucun compte trouvé.</td></tr>');
    } else {
        accounts.forEach(account => {
            const row = `<tr>
                <td>${account.name}</td>
                <td>${account.type}</td>
                <td>${account.balance.toFixed(2)} €</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-success btn-sm" onclick="depositToAccount('${account.id}')">Dépôt</button>
                        <button class="btn btn-warning btn-sm ml-2" onclick="withdrawFromAccount('${account.id}')">Retrait</button>
                        <button class="btn btn-danger btn-sm ml-2" onclick="deleteAccount('${account.id}')">Supprimer</button>
                    </div>
                </td>
            </tr>`;
            existingAccountsTableBody.append(row);
        });
    }
}

function addNewAccount() {
    const accountName = $('#accountName').val().trim();
    const accountType = $('#accountType').val();

    $('#successMessage').hide();
    $('#errorMessage').hide();

    if (accountName === "" || accountType === "") {
        showErrorMessage("Veuillez remplir tous les champs.");
        return;
    }

    if (!userId) {
        alert("Utilisateur non connecté.");
        window.location.href = '../signin/index.html';
        return;
    }

    const newAccount = {
        userId: userId,
        name: accountName,
        type: accountType,
        balance: 0
    };

    $.ajax({
        url: 'http://localhost:3000/accounts',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newAccount),
        success: function () {
            showSuccessMessage("Compte ajouté avec succès !");
            $('#addAccountForm')[0].reset();
            loadExistingAccounts();
        },
        error: function (error) {
            console.error("Erreur lors de l'ajout du compte :", error);
            showErrorMessage("Erreur lors de l'ajout du compte. Veuillez réessayer.");
        }
    });
}

function deleteAccount(accountId) {
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.");
    if (!confirmation) return;

    $.ajax({
        url: `http://localhost:3000/accounts/${accountId}`,
        type: 'DELETE',
        success: function () {
            showSuccessMessage("Compte supprimé avec succès !");
            loadExistingAccounts();
        },
        error: function (error) {
            console.error("Erreur lors de la suppression du compte :", error);
            showErrorMessage("Erreur lors de la suppression du compte. Veuillez réessayer.");
        }
    });
}

function showErrorMessage(message) {
    $('#errorMessage').text(message).fadeIn();
    setTimeout(function () {
        $('#errorMessage').fadeOut();
    }, 5000);
}

function showSuccessMessage(message) {
    $('#successMessage').text(message).fadeIn();
    setTimeout(function () {
        $('#successMessage').fadeOut();
    }, 5000);
}

function depositToAccount(accountId) {
    const depositAmount = prompt("Entrez le montant à déposer :");
    if (!depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
        alert("Montant de dépôt non valide. Veuillez entrer un nombre positif.");
        return;
    }

    $.ajax({
        url: `http://localhost:3000/accounts/${accountId}`,
        type: 'GET',
        success: function (account) {
            const newBalance = account.balance + parseFloat(depositAmount);

            $.ajax({
                url: `http://localhost:3000/accounts/${accountId}`,
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ balance: newBalance }),
                success: function () {
                    const transaction = {
                        id: generateTransactionId(),
                        fromUserId: account.userId,
                        toUserId: account.userId,
                        fromAccountId: accountId,
                        toAccountId: accountId,
                        amount: parseFloat(depositAmount),
                        date: new Date().toISOString(),
                        transferType: "deposit",
                        description: `Dépôt de ${parseFloat(depositAmount).toFixed(2)} € sur ${account.name}`,
                        senderBalanceAfter: newBalance,
                        recipientBalanceAfter: newBalance
                    };

                    recordTransaction(transaction, function () {
                        showSuccessMessage("Dépôt effectué avec succès !");
                        loadExistingAccounts();
                    });
                },
                error: function (error) {
                    console.error("Erreur lors de la mise à jour du solde :", error);
                    showErrorMessage("Erreur lors du dépôt. Veuillez réessayer.");
                }
            });
        },
        error: function (error) {
            console.error("Erreur lors de la récupération du solde actuel :", error);
            showErrorMessage("Erreur lors de la récupération des informations du compte.");
        }
    });
}

function withdrawFromAccount(accountId) {
    const withdrawAmount = prompt("Entrez le montant à retirer :");
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
        alert("Montant de retrait non valide. Veuillez entrer un nombre positif.");
        return;
    }

    $.ajax({
        url: `http://localhost:3000/accounts/${accountId}`,
        type: 'GET',
        success: function (account) {
            const currentBalance = account.balance;
            const amountToWithdraw = parseFloat(withdrawAmount);

            if (amountToWithdraw > currentBalance) {
                alert("Fonds insuffisants pour effectuer ce retrait.");
                return;
            }

            const newBalance = currentBalance - amountToWithdraw;

            $.ajax({
                url: `http://localhost:3000/accounts/${accountId}`,
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ balance: newBalance }),
                success: function () {
                    const transaction = {
                        id: generateTransactionId(),
                        fromUserId: account.userId,
                        toUserId: account.userId,
                        fromAccountId: accountId,
                        toAccountId: accountId,
                        amount: amountToWithdraw,
                        date: new Date().toISOString(),
                        transferType: "withdrawal",
                        description: `Retrait de ${amountToWithdraw.toFixed(2)} € de ${account.name}`,
                        senderBalanceAfter: newBalance,
                        recipientBalanceAfter: newBalance
                    };

                    recordTransaction(transaction, function () {
                        showSuccessMessage("Retrait effectué avec succès !");
                        loadExistingAccounts();
                    });
                },
                error: function (error) {
                    console.error("Erreur lors de la mise à jour du solde :", error);
                    showErrorMessage("Erreur lors du retrait. Veuillez réessayer.");
                }
            });
        },
        error: function (error) {
            console.error("Erreur lors de la récupération du solde actuel :", error);
            showErrorMessage("Erreur lors de la récupération des informations du compte.");
        }
    });
}

function recordTransaction(transaction, callback) {
    $.ajax({
        url: 'http://localhost:3000/transactions',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(transaction),
        success: function () {
            console.log("Transaction enregistrée avec succès.");
            if (typeof callback === 'function') {
                callback();
            }
        },
        error: function (error) {
            console.error("Erreur lors de l'enregistrement de la transaction :", error);
            showErrorMessage("Erreur lors de l'enregistrement de la transaction.");
        }
    });
}

function generateTransactionId() {
    return Math.random().toString(36).substr(2, 8);
}
