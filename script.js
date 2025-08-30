document.getElementById('message-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = document.getElementById('message-text').value;
    const photoFile = document.getElementById('message-photo').files[0];

    const formData = new FormData();
    formData.append('text', text);
    formData.append('photo', photoFile);

    try {
        const response = await fetch('/.netlify/functions/submit-message', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('Bericht succesvol verstuurd!');
            document.getElementById('message-form').reset();
        } else {
            const errorText = await response.text();
            alert('Fout bij het versturen van het bericht: ' + errorText);
        }
    } catch (error) {
        console.error('Verstuurfout:', error);
        alert('Er is een probleem opgetreden.');
    }
});