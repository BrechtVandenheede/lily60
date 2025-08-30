const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy'); // Use Busboy to parse form data with files
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: event.headers });
        let text = '';
        let fileBuffer = null;
        let fileMimeType = '';
        const fileName = `${uuidv4()}.jpg`;

        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'text') {
                text = val;
            }
        });

        busboy.on('file', (fieldname, file, info) => {
            const chunks = [];
            file.on('data', chunk => chunks.push(chunk));
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
                fileMimeType = info.mimeType;
            });
        });

        busboy.on('finish', async () => {
            try {
                // Upload the photo to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('feestfotos')
                    .upload(fileName, fileBuffer, {
                        contentType: fileMimeType,
                    });

                if (uploadError) {
                    console.error('Upload Error:', uploadError);
                    return resolve({ statusCode: 500, body: 'Image upload failed' });
                }

                // Get the public URL of the uploaded image
                const { data: publicURLData } = supabase.storage
                    .from('feestfotos')
                    .getPublicUrl(fileName);

                const publicURL = publicURLData.publicUrl;

                // Insert the message and photo URL into the database
                const { error: dbError } = await supabase
                    .from('berichten')
                    .insert([{ tekst: text, foto_url: publicURL }]);

                if (dbError) {
                    console.error('DB Insert Error:', dbError);
                    return resolve({ statusCode: 500, body: 'Database insert failed' });
                }

                resolve({ statusCode: 200, body: 'Success' });
            } catch (error) {
                console.error('Server error:', error);
                resolve({ statusCode: 500, body: 'Internal Server Error' });
            }
        });

        busboy.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary'));
    });
};
