class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.backupInterval = null;
        this.stream = null;
        this.currentRecordingId = null;
        this.isResetting = false;
        this.isCancelling = false;
        
        this.recordButton = document.getElementById('recordButton');
        this.status = document.getElementById('status');
        this.duration = document.getElementById('duration');
        this.recordingsList = document.getElementById('recordingsList');
        this.recordingControls = document.getElementById('recordingControls');
        this.resetButton = document.getElementById('resetButton');
        this.cancelButton = document.getElementById('cancelButton');
        
        this.init();
    }
    
    async init() {
        this.recordButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });
        
        this.resetButton.addEventListener('click', () => {
            this.resetRecording();
        });
        
        this.cancelButton.addEventListener('click', () => {
            this.cancelRecording();
        });
        
        // Sprawdź czy jest przerwane nagranie do odzyskania
        this.checkForInterruptedRecording();
        
        this.loadRecordings();
        
        // Żądanie uprawnień do mikrofonu przy starcie
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            this.status.textContent = 'Dotknij aby nagrać';
        } catch (error) {
            this.status.textContent = 'Brak dostępu do mikrofonu';
            console.error('Błąd dostępu do mikrofonu:', error);
        }
    }
    
    async startRecording() {
        try {
            // Żądanie dostępu do mikrofonu z wysoką jakością dla iPhone
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100,
                    channelCount: 1,
                    volume: 1.0,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Sprawdzenie czy MediaRecorder obsługuje webm lub mp4
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/wav';
                }
            }
            
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType
            });
            
            this.audioChunks = [];
            this.isRecording = true;
            this.startTime = Date.now();
            this.currentRecordingId = Date.now();
            
            // Zapisz stan nagrywania w localStorage
            this.saveRecordingState();
            
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });
            
            this.mediaRecorder.addEventListener('stop', () => {
                // Sprawdź czy to normalne zatrzymanie (nie reset, nie anulowanie)
                if (this.audioChunks.length > 0 && !this.isResetting && !this.isCancelling) {
                    this.saveRecording();
                }
                
                // Reset flag po zakończeniu
                this.isResetting = false;
                this.isCancelling = false;
                
                this.cleanup();
            });
            
            this.mediaRecorder.start(1000); // Zbieranie danych co sekundę
            
            this.updateUI();
            this.startTimer();
            this.startBackupTimer();
            
        } catch (error) {
            console.error('Błąd rozpoczęcia nagrywania:', error);
            this.status.textContent = 'Błąd: ' + error.message;
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.clearRecordingState();
        }
    }
    
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        
        this.updateUI();
    }
    
    updateUI() {
        if (this.isRecording) {
            this.recordButton.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-3xl cursor-pointer shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 flex items-center justify-center border-4 border-white/10 animate-pulse-scale';
            this.recordButton.innerHTML = '⏹';
            this.status.textContent = 'Nagrywanie...';
            this.recordingControls.className = 'space-y-3';
        } else {
            this.recordButton.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-navigator-purple to-purple-600 text-white text-3xl cursor-pointer shadow-xl shadow-navigator-purple/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-navigator-purple/40 active:scale-95 flex items-center justify-center border-4 border-white/10';
            this.recordButton.innerHTML = '●';
            this.status.textContent = 'Dotknij aby nagrać';
            this.duration.textContent = '00:00';
            this.recordingControls.className = 'hidden space-y-3';
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isRecording && this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                this.duration.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
    
    async saveRecording() {
        if (this.audioChunks.length === 0) return;
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Konwersja do base64 dla localStorage
        const reader = new FileReader();
        reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            
            const recording = {
                id: this.currentRecordingId || Date.now(),
                name: `Nagranie ${new Date().toLocaleString('pl-PL')}`,
                date: new Date().toISOString(),
                duration: duration,
                audio: base64Audio,
                mimeType: audioBlob.type,
                corrupted: false
            };
            
            this.saveToStorage(recording);
            this.loadRecordings();
            
            // Wyczyść backup po udanym zapisaniu
            this.clearRecordingState();
            
            this.status.textContent = `Nagranie zapisane (${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')})`;
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    saveToStorage(recording) {
        let recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        recordings.unshift(recording); // Dodaj na początku listy
        
        // Ograniczenie do 50 nagrań (aby nie przekroczyć limitu localStorage)
        if (recordings.length > 50) {
            recordings = recordings.slice(0, 50);
        }
        
        localStorage.setItem('audioRecordings', JSON.stringify(recordings));
    }
    
    loadRecordings() {
        const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        
        if (recordings.length === 0) {
            this.recordingsList.innerHTML = '<div class="text-center pb-10 text-gray-500 italic">Brak nagrań</div>';
            return;
        }
        
        this.recordingsList.innerHTML = recordings.map(recording => {
            const recordingDate = new Date(recording.date);
            const now = new Date();
            const diffTime = Math.abs(now - recordingDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            let timeText;
            if (diffDays === 0) {
                timeText = 'Dziś';
            } else if (diffDays === 1) {
                timeText = 'Wczoraj';
            } else if (diffDays < 7) {
                timeText = `${diffDays} dni temu`;
            } else {
                timeText = recordingDate.toLocaleDateString('pl-PL');
            }
            
            const corruptedClasses = recording.corrupted ? 'border-red-400/40 bg-red-900/20' : 'border-white/10';
            const corruptedTextClasses = recording.corrupted ? 'text-red-300' : 'text-gray-100';
            
            return `
            <div class="w-full bg-white/5 backdrop-blur-sm rounded-xl py-4 px-5 mb-2 border ${corruptedClasses} flex justify-between items-center transition-all duration-200 hover:bg-white/8 hover:border-navigator-purple/30 hover:shadow-lg hover:shadow-black/10">
                <div class="flex-1 text-left">
                    <div class="text-sm text-gray-100 mb-1">
                        Przykładowy tekst nagrania
                    </div>
                    <div class="text-xs text-gray-400">
                        ${Math.floor(recording.duration/60)}:${(recording.duration%60).toString().padStart(2, '0')} - ${recording.name.replace('Nagranie ', '')}
                        ${recording.corrupted ? ' • ODZYSKANE' : ''}
                    </div>
                </div>
                <div class="flex gap-1 items-center ml-auto">
                    <button class="p-2 border-0 cursor-pointer text-lg transition-all duration-200 text-blue-300 hover:text-blue-100 hover:scale-110" onclick="recorder.playRecording('${recording.id}')">
                        ▶️
                    </button>
                    <button class="${this.getTranscribeButtonClassesMinimal(recording)}" 
                            onclick="${recording.transcription ? `recorder.openTranscriptionView('${recording.id}')` : `recorder.transcribeRecording('${recording.id}')`}"
                            ${recording.transcribing ? 'disabled' : ''}>
                        ${recording.transcribing ? '⏳' : 
                          recording.transcription ? '📄' : '🎤'}
                    </button>
                </div>
            </div>
        `}).join('');
    }
    
    getTranscribeButtonClasses(recording) {
        const baseClasses = 'px-3 py-2 border-0 rounded-md cursor-pointer text-xs font-medium transition-all duration-200 text-center whitespace-nowrap min-w-[60px]';
        
        if (recording.transcribing) {
            return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed`;
        } else if (recording.transcription) {
            return `${baseClasses} bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:text-emerald-100`;
        } else {
            return `${baseClasses} bg-navigator-purple/20 text-purple-300 border border-navigator-purple/30 hover:bg-navigator-purple/30 hover:text-purple-100`;
        }
    }
    
    getTranscribeButtonClassesMinimal(recording) {
        const baseClasses = 'p-2 border-0 cursor-pointer text-lg transition-all duration-200';
        
        if (recording.transcribing) {
            return `${baseClasses} text-gray-400 cursor-not-allowed`;
        } else if (recording.transcription) {
            return `${baseClasses} text-emerald-300 hover:text-emerald-100 hover:scale-110`;
        } else {
            return `${baseClasses} text-navigator-purple hover:text-purple-300 hover:scale-110`;
        }
    }
    
    playRecording(id) {
        const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        const recording = recordings.find(r => r.id.toString() === id);
        
        if (!recording) return;
        
        // Konwersja base64 z powrotem do blob
        const byteCharacters = atob(recording.audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: recording.mimeType });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.play().catch(error => {
            console.error('Błąd odtwarzania:', error);
            this.status.textContent = 'Błąd odtwarzania nagrania';
        });
        
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
        });
        
        this.status.textContent = 'Odtwarzanie nagrania...';
    }
    
    startBackupTimer() {
        // Automatyczne zapisywanie co 5 sekund
        this.backupInterval = setInterval(() => {
            if (this.isRecording && this.audioChunks.length > 0) {
                this.saveBackup();
            }
        }, 5000);
    }
    
    saveBackup() {
        if (this.audioChunks.length === 0) return;
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const currentDuration = Math.floor((Date.now() - this.startTime) / 1000);
        
        const reader = new FileReader();
        reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            
            const backup = {
                id: this.currentRecordingId,
                chunks: base64Audio,
                startTime: this.startTime,
                duration: currentDuration,
                mimeType: audioBlob.type,
                timestamp: Date.now()
            };
            
            localStorage.setItem('recordingBackup', JSON.stringify(backup));
            console.log(`Backup zapisany: ${currentDuration}s`);
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    saveRecordingState() {
        const state = {
            isRecording: true,
            startTime: this.startTime,
            recordingId: this.currentRecordingId
        };
        localStorage.setItem('recordingState', JSON.stringify(state));
    }
    
    clearRecordingState() {
        localStorage.removeItem('recordingState');
        localStorage.removeItem('recordingBackup');
    }
    
    checkForInterruptedRecording() {
        const backup = localStorage.getItem('recordingBackup');
        
        if (backup) {
            try {
                const recordingBackup = JSON.parse(backup);
                
                // Sprawdź czy backup ma więcej niż 5 sekund (oznacza przerwane nagranie)
                if (recordingBackup.duration >= 5) {
                    // Automatycznie dodaj do listy jako uszkodzone nagranie
                    this.addCorruptedRecording(recordingBackup);
                }
                
                // Wyczyść backup po sprawdzeniu
                localStorage.removeItem('recordingBackup');
                localStorage.removeItem('recordingState');
                
            } catch (error) {
                console.error('Błąd odczytu backup:', error);
                localStorage.removeItem('recordingBackup');
                localStorage.removeItem('recordingState');
            }
        }
    }
    
    showRecoveryDialog(backup) {
        const duration = backup.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        const message = `Znaleziono przerwane nagranie (${minutes}:${seconds.toString().padStart(2, '0')}). Czy chcesz je odzyskać?`;
        
        if (confirm(message)) {
            this.recoverRecording(backup);
        } else {
            this.clearRecordingState();
        }
    }
    
    recoverRecording(backup) {
        // Konwersja backup do nagrania
        const byteCharacters = atob(backup.chunks);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: backup.mimeType });
        
        const reader = new FileReader();
        reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            
            const recording = {
                id: backup.id,
                name: `Odzyskane nagranie ${new Date(backup.startTime).toLocaleString('pl-PL')}`,
                date: new Date(backup.startTime).toISOString(),
                duration: backup.duration,
                audio: base64Audio,
                mimeType: backup.mimeType
            };
            
            this.saveToStorage(recording);
            this.loadRecordings();
            this.clearRecordingState();
            
            this.status.textContent = `Nagranie odzyskane (${Math.floor(backup.duration/60)}:${(backup.duration%60).toString().padStart(2, '0')})`;
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    addCorruptedRecording(backup) {
        // Sprawdź czy to nagranie już nie istnieje
        const existingRecordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        const exists = existingRecordings.find(r => r.id === backup.id);
        
        if (exists) {
            console.log('Nagranie już istnieje, pomijam odzyskiwanie');
            return;
        }
        
        const byteCharacters = atob(backup.chunks);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: backup.mimeType });
        
        const reader = new FileReader();
        reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            
            const recording = {
                id: backup.id,
                name: `🔧 PRZERWANE: ${new Date(backup.startTime).toLocaleString('pl-PL')}`,
                date: new Date(backup.startTime).toISOString(),
                duration: backup.duration,
                audio: base64Audio,
                mimeType: backup.mimeType,
                corrupted: true
            };
            
            this.saveToStorage(recording);
            this.status.textContent = `Odzyskano przerwane nagranie (${Math.floor(backup.duration/60)}:${(backup.duration%60).toString().padStart(2, '0')})`;
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    async transcribeRecording(id) {
        const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        const recordingIndex = recordings.findIndex(r => r.id.toString() === id);
        
        if (recordingIndex === -1) {
            this.status.textContent = 'Nie znaleziono nagrania';
            return;
        }
        
        const recording = recordings[recordingIndex];
        
        if (recording.transcription) {
            this.status.textContent = 'Nagranie już ma transkrypcję';
            return;
        }
        
        // Sprawdź czy jest ustawiony klucz API
        const apiKey = this.getOpenAIKey();
        if (!apiKey) {
            this.showAPIKeyDialog();
            return;
        }
        
        // Oznacz jako transkrybowane
        recordings[recordingIndex].transcribing = true;
        localStorage.setItem('audioRecordings', JSON.stringify(recordings));
        this.loadRecordings();
        
        this.status.textContent = 'Wysyłam do OpenAI Whisper...';
        
        try {
            // Konwertuj base64 z powrotem do blob
            const byteCharacters = atob(recording.audio);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: recording.mimeType });
            
            // Przygotuj FormData dla OpenAI API
            const formData = new FormData();
            formData.append('file', audioBlob, `recording_${id}.webm`);
            formData.append('model', 'whisper-1');
            formData.append('language', 'pl');
            formData.append('response_format', 'text');
            
            // Wyślij do OpenAI Whisper API
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            
            const transcriptionText = await response.text();
            
            // Zapisz transkrypcję
            recordings[recordingIndex].transcription = transcriptionText.trim();
            recordings[recordingIndex].transcribing = false;
            localStorage.setItem('audioRecordings', JSON.stringify(recordings));
            this.loadRecordings();
            
            this.status.textContent = 'Transkrypcja ukończona!';
            
        } catch (error) {
            console.error('Błąd transkrypcji:', error);
            
            // Usuń flagę transkrypcji w przypadku błędu
            recordings[recordingIndex].transcribing = false;
            localStorage.setItem('audioRecordings', JSON.stringify(recordings));
            this.loadRecordings();
            
            let errorMessage = 'Błąd transkrypcji';
            if (error.message.includes('401')) {
                errorMessage = 'Nieprawidłowy klucz OpenAI API';
            } else if (error.message.includes('429')) {
                errorMessage = 'Przekroczono limit API OpenAI';
            } else if (error.message.includes('network')) {
                errorMessage = 'Brak połączenia internetowego';
            }
            
            this.status.textContent = errorMessage;
        }
    }
    
    getOpenAIKey() {
        // Sprawdź localStorage najpierw
        let apiKey = localStorage.getItem('openai_api_key');
        if (apiKey) return apiKey;
        
        // Fallback - można dodać inne źródła kluczy
        return null;
    }
    
    showAPIKeyDialog() {
        const apiKey = prompt(`
🔑 WYMAGANY KLUCZ OPENAI API

Aby korzystać z transkrypcji, potrzebujesz klucza OpenAI API.

1. Idź na: https://platform.openai.com/api-keys
2. Zaloguj się / Zarejestruj
3. Kliknij "Create new secret key"
4. Skopiuj klucz i wklej poniżej

Koszt: ~$0.006 za minutę nagrania

Wprowadź klucz OpenAI API:`);
        
        if (apiKey && apiKey.trim()) {
            localStorage.setItem('openai_api_key', apiKey.trim());
            this.status.textContent = 'Klucz API zapisany! Spróbuj ponownie transkrypcję.';
        } else {
            this.status.textContent = 'Transkrypcja wymaga klucza OpenAI API';
        }
    }
    
    resetRecording() {
        if (!this.isRecording) return;
        
        // Ustaw flagę resetowania
        this.isResetting = true;
        
        // Zatrzymaj obecne nagrywanie
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        
        // Wyczyść dane
        this.audioChunks = [];
        
        // Rozpocznij nowe nagrywanie po chwili
        this.status.textContent = 'Resetowanie...';
        setTimeout(() => {
            this.startRecording();
        }, 200);
    }
    
    cancelRecording() {
        if (!this.isRecording) return;
        
        // Ustaw flagę anulowania
        this.isCancelling = true;
        this.isRecording = false;
        
        // Zatrzymaj nagrywanie
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        
        // Wyczyść wszystkie dane bez zapisywania
        this.audioChunks = [];
        this.clearRecordingState();
        
        this.status.textContent = 'Nagrywanie anulowane';
        setTimeout(() => {
            this.status.textContent = 'Dotknij aby nagrać';
        }, 2000);
    }
    
    openTranscriptionView(id) {
        const recordings = JSON.parse(localStorage.getItem('audioRecordings') || '[]');
        const recording = recordings.find(r => r.id.toString() === id);
        
        if (!recording || !recording.transcription) {
            this.status.textContent = 'Brak transkrypcji do wyświetlenia';
            return;
        }
        
        // Wypełnij dane
        document.getElementById('transcriptionTitle').textContent = `Transkrypcja: ${recording.name}`;
        
        document.getElementById('transcriptionMetadata').innerHTML = `
            <strong>Nagranie:</strong> ${recording.name}<br>
            <strong>Data:</strong> ${new Date(recording.date).toLocaleString('pl-PL')}<br>
            <strong>Czas trwania:</strong> ${Math.floor(recording.duration/60)}:${(recording.duration%60).toString().padStart(2, '0')}<br>
            <strong>Status:</strong> ${recording.corrupted ? 'Odzyskane' : 'Normalne'}
        `;
        
        document.getElementById('transcriptionContent').textContent = recording.transcription;
        
        // Pokaż pełnoekranowy widok
        const fullscreen = document.getElementById('transcriptionFullscreen');
        fullscreen.className = 'fixed inset-0 w-full h-full bg-gradient-to-br from-navigator-dark via-navigator-mid to-navigator-blue z-[1000] flex flex-col p-5 overflow-y-auto';
        
        // Zablokuj scrollowanie body
        document.body.style.overflow = 'hidden';
    }
    
    closeTranscriptionView() {
        // Ukryj pełnoekranowy widok
        const fullscreen = document.getElementById('transcriptionFullscreen');
        fullscreen.className = 'fixed inset-0 w-full h-full bg-gradient-to-br from-navigator-dark via-navigator-mid to-navigator-blue z-[1000] hidden flex-col p-5 overflow-y-auto';
        
        // Przywróć scrollowanie body
        document.body.style.overflow = 'auto';
    }
}

// Inicjalizacja aplikacji
let recorder;
document.addEventListener('DOMContentLoaded', () => {
    recorder = new AudioRecorder();
});

// Dodatkowe wsparcie dla iOS
document.addEventListener('touchstart', function() {}, { passive: true });