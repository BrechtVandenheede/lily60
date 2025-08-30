// Replace with your Supabase credentials
const SUPABASE_URL = 'JOUW_PROJECT_URL';
const SUPABASE_ANON_KEY = 'JOUW_ANON_KEY';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const messageGrid = document.getElementById('message-grid');

let lastMessageTimestamp = new Date().toISOString();

async function fetchAndRenderMessages() {
    const { data, error } = await supabase
        .from('berichten')
        .select('*')
        .gt('created_at', lastMessageTimestamp)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    if (data.length > 0) {
        data.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-card';
            messageDiv.innerHTML = `
                <img src="${message.foto_url}" alt="Feestfoto">
                <p>${message.tekst}</p>
            `;
            messageGrid.prepend(messageDiv);
        });

        lastMessageTimestamp = data[data.length - 1].created_at;
    }
}

// Fetch messages every 5 seconds
setInterval(fetchAndRenderMessages, 5000);

// Initial fetch
fetchAndRenderMessages();