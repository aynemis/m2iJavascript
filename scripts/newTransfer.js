$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }

    $('.container').css('display', 'block');
    loadSenderAccounts();
    handleTransferTypeToggle();
    handleFormSubmission();
});
const sanitizeInput = (input) => DOMPurify.sanitize(input);
const userId = sanitizeInput(localStorage.getItem("userId")); // Nettoyage ajouté

function loadSenderAccounts() {
    if (!userId) {
        window.location.href = '../views/signin.html';
        return;
    }

    $.ajax({
        url: `http://localhost:8000/accounts?userId=${userId}`, // Nettoyage ajouté
        type: 'GET',
        success: populateAccountOptions,
        error: function (error) {
            console.error("Erreur lors du chargement des comptes :", error);
            showErrorMessage("Erreur lors du chargement de vos comptes. Veuillez réessayer.");
        }
    });
}


function populateAccountOptions(accounts) {
    const senderAccountSelect = $('#senderAccount');
    const recipientAccountSelect = $('#recipientAccount');
    senderAccountSelect.empty().append('<option value="">Sélectionnez un compte</option>');
    recipientAccountSelect.empty().append('<option value="">Sélectionnez un compte</option>');
    accounts.forEach(account => {
        const sanitizedAccountName = sanitizeInput(account.name); // Nettoyage ajouté
        const accountOption = `<option value="${sanitizeInput(account.id)}">${sanitizedAccountName} - Solde: €${account.balance.toFixed(2)}</option>`; // Nettoyage ajouté
        senderAccountSelect.append(accountOption);
        recipientAccountSelect.append(accountOption);
    });
}

function handleTransferTypeToggle() {
    $('#transferType').on('change', function () {
        const isInternal = $(this).val() === 'internal';
        $('#internalFields').toggle(isInternal);
        $('#externalFields').toggle(!isInternal);
    }).trigger('change');
}

function handleFormSubmission() {
    $('#transferForm').on('submit', function (e) {
        e.preventDefault();
        const transferType = sanitizeInput($('#transferType').val()); // Nettoyage ajouté

        if (transferType === 'internal') {
            performInternalTransfer();
        } else {
            performExternalTransfer();
        }
    });
}
function performInternalTransfer() {
    const senderAccountId = sanitizeInput($('#senderAccount').val()); // Nettoyage ajouté
    const recipientAccountId = sanitizeInput($('#recipientAccount').val()); // Nettoyage ajouté
    const amount = parseFloat($('#transferAmount').val());
    const transferType = 'internal';
    resetMessages();

    if (!validateFormInputs(transferType, null, senderAccountId, amount)) return;

    if (senderAccountId === recipientAccountId) {
        showErrorMessage("Les comptes source et destinataire doivent être différents.");
        return;
    }

    fetchAccount(senderAccountId, function (senderAccount) {
        if (senderAccount.balance < amount) {
            showErrorMessage("Fonds insuffisants.");
            return;
        }
        fetchRecipientAccounts(userId, function (recipientAccounts) {
            const recipientAccount = recipientAccounts.find(account => account.id === recipientAccountId);
            if (!recipientAccount) {
                showErrorMessage("Le destinataire n'a pas de compte.");
                return;
            }
            processInternalTransfer(senderAccount, recipientAccount, amount, transferType);
        });
    });
}


function performExternalTransfer() {
    const recipientEmail = sanitizeInput($('#recipientEmail').val().trim()); // Nettoyage ajouté
    const senderAccountId = sanitizeInput($('#senderAccount').val()); // Nettoyage ajouté
    const amount = parseFloat($('#transferAmount').val());
    const transferType = 'external';
    resetMessages();

    if (!validateFormInputs(transferType, recipientEmail, senderAccountId, amount)) return;

    $.ajax({
        url: `http://localhost:8000/users?email=${recipientEmail}`, // La sanitisation est appliquée à l'email
        type: 'GET',
        success: function (users) {
            const recipientId = users[0].id;
            fetchRecipientAccounts(recipientId, function (recipientAccounts) {
                const recipientAccount = recipientAccounts.find(account => account.type === 'Courant');
                if (!recipientAccount) {
                    showErrorMessage("Le destinataire n'a pas de compte courant.");
                    return;
                }
                fetchAccount(senderAccountId, function (senderAccount) {
                    if (senderAccount.balance < amount) {
                        showErrorMessage("Fonds insuffisants.");
                        return;
                    }
                    processExternalTransfer(senderAccount, recipientAccount, amount, transferType);
                });
            });
        },
        error: function (xhr, status, error) {
            console.error("AJAX Error:", error);
            if (xhr.status === 404) {
                showErrorMessage("L'adresse email du destinataire est invalide ou n'existe pas.");
            } else {
                showErrorMessage("Erreur lors de la récupération de l'utilisateur.");
            }
        }
    });
}


function processInternalTransfer(senderAccount, recipientAccount, amount) {
    const updatedSenderBalance = senderAccount.balance - amount;
    const updatedRecipientBalance = recipientAccount.balance + amount;

    updateAccountBalance(senderAccount.id, { ...senderAccount, balance: updatedSenderBalance }, function () {
        updateAccountBalance(recipientAccount.id, { ...recipientAccount, balance: updatedRecipientBalance }, function () {
            createTransactionRecord(senderAccount, recipientAccount, amount, userId, recipientAccount.userId, senderAccount.name, recipientAccount.name, 'internal');
        });
    });
}

function processExternalTransfer(senderAccount, recipientAccount, amount, transferType) {
    const updatedSenderBalance = senderAccount.balance - amount;
    const updatedRecipientBalance = recipientAccount.balance + amount;

    updateAccountBalance(senderAccount.id, { balance: updatedSenderBalance }, function () {
        updateAccountBalance(recipientAccount.id, { balance: updatedRecipientBalance }, function () {
            createTransactionRecord(senderAccount, recipientAccount, amount, userId, recipientAccount.userId, senderAccount.name, recipientAccount.name, transferType);
        });
    });
}

function updateAccountBalance(accountId, updatedAccount, onSuccess) {
    // Validation de accountId pour s'assurer qu'il est valide
    accountId = sanitizeInput(accountId);  // Si nécessaire, assurez-vous qu'il est un ID valide

    $.ajax({
        url: `http://localhost:8000/accounts/${accountId}`,
        type: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(updatedAccount),
        success: onSuccess,
        error: function (error) {
            console.error("Erreur lors de la mise à jour du compte :", error);
            showErrorMessage("Erreur lors de la mise à jour du compte. Veuillez réessayer.");
        }
    });
}

function fetchAccount(accountId, callback) {
    // Validation de accountId pour s'assurer qu'il est valide
    accountId = sanitizeInput(accountId);  // Si nécessaire, assurez-vous qu'il est un ID valide

    $.ajax({
        url: `http://localhost:8000/accounts/${accountId}`,
        type: 'GET',
        success: function (account) {
            callback(account);
        },
        error: function (error) {
            console.error("Erreur lors de la récupération du compte :", error);
            showErrorMessage("Erreur lors de la récupération du compte.");
        }
    });
}

function fetchRecipientAccounts(recipientId, callback) {
    // Validation et sanitisation de recipientId
    recipientId = sanitizeInput(recipientId);  // Assurez-vous qu'il est un ID valide

    $.ajax({
        url: `http://localhost:8000/accounts?userId=${recipientId}`,
        type: 'GET',
        success: function (accounts) {
            if (accounts.length === 0) {
                showErrorMessage("Le destinataire n'a pas de compte.");
                return;
            }
            callback(accounts);
        },
        error: function (error) {
            console.error("Erreur lors de la récupération des comptes destinataire:", error);
            showErrorMessage("Erreur lors de la récupération des comptes destinataire.");
        }
    });
}


function createTransactionRecord(senderAccount, recipientAccount, amount, senderId, recipientId, senderName, recipientName, transferType) {
    // Sanitiser les noms pour éviter les attaques XSS
    senderName = sanitizeInput(senderName);
    recipientName = sanitizeInput(recipientName);

    const transaction = {
        fromUserId: senderId,
        toUserId: recipientId,
        fromAccountId: senderAccount.id,
        toAccountId: recipientAccount.id,
        amount: amount,
        date: new Date().toISOString(),
        transferType: transferType,
        description: transferType === 'internal'
            ? `Transfert de ${amount.toFixed(2)} € entre vos comptes: ${senderAccount.name} vers ${recipientAccount.name}`
            : `Transfert de ${amount.toFixed(2)} € de ${senderName} à ${recipientName}`,
        senderBalanceAfter: senderAccount.balance - amount,
        recipientBalanceAfter: recipientAccount.balance + amount
    };

    $.ajax({
        url: 'http://localhost:8000/transactions',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(transaction),
        success: function () {
            showSuccessMessage("Transfert effectué avec succès !");
            $('#transferForm')[0].reset();
            loadSenderAccounts();
        },
        error: function (error) {
            console.error("Erreur lors de la création de la transaction :", error);
            showErrorMessage("Erreur lors de la création de la transaction. Veuillez réessayer.");
        }
    });
}
function resetMessages() {
    $('#successMessage').hide();
    $('#errorMessage').hide();
}

function validateFormInputs(transferType, recipientEmail, senderAccountId, amount) {
    if (transferType === "external" && !recipientEmail) {
        showErrorMessage("Veuillez fournir l'email du destinataire pour un transfert externe.");
        return false;
    }
    if (!senderAccountId || isNaN(amount) || amount <= 0) {
        showErrorMessage("Veuillez remplir tous les champs avec des valeurs valides.");
        return false;
    }
    return true;
}

function resetMessages() {
    $('#successMessage').hide();
    $('#errorMessage').hide();
}

function validateFormInputs(transferType, recipientEmail, senderAccountId, amount) {
    recipientEmail = sanitizeInput(recipientEmail);

    if (transferType === "external" && !recipientEmail) {
        showErrorMessage("Veuillez fournir l'email du destinataire pour un transfert externe.");
        return false;
    }
    if (!senderAccountId || isNaN(amount) || amount <= 0) {
        showErrorMessage("Veuillez remplir tous les champs avec des valeurs valides.");
        return false;
    }
    return true;
}
function showSuccessMessage(message) {
    $('#successMessage').text(message).fadeIn();
    setTimeout(() => $('#successMessage').fadeOut(), 5000);
}
function showErrorMessage(message) {
    $('#errorMessage').text(message).fadeIn();
    setTimeout(() => $('#errorMessage').fadeOut(), 5000);
}
