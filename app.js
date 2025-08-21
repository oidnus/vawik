// IndexedDB wrapper dla Vawik
class VawikDB {
    constructor() {
        this.db = null;
        this.dbName = 'VawikAudioDB';
        this.dbVersion = 1;
    }

    async init() {
        console.log('🗄️ [DB] Inicjalizacja IndexedDB');
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ [DB] Błąd otwarcia IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ [DB] IndexedDB zainicjalizowane');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔧 [DB] Aktualizacja struktury bazy danych');
                const db = event.target.result;
                
                // Store dla nagrań audio
                if (!db.objectStoreNames.contains('recordings')) {
                    const recordingsStore = db.createObjectStore('recordings', { keyPath: 'id' });
                    recordingsStore.createIndex('date', 'date', { unique: false });
                    console.log('📁 [DB] Utworzono store "recordings"');
                }
                
                // Store dla tytułów nagrań
                if (!db.objectStoreNames.contains('titles')) {
                    db.createObjectStore('titles', { keyPath: 'recordingId' });
                    console.log('📁 [DB] Utworzono store "titles"');
                }
                
                // Store dla backupów nagrań
                if (!db.objectStoreNames.contains('backups')) {
                    db.createObjectStore('backups', { keyPath: 'id' });
                    console.log('📁 [DB] Utworzono store "backups"');
                }
            };
        });
    }

    async saveRecording(recording) {
        console.log(`💾 [DB] Zapisuję nagranie ID: ${recording.id}`);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['recordings'], 'readwrite');
            const store = transaction.objectStore('recordings');
            const request = store.put(recording);
            
            request.onsuccess = () => {
                console.log(`✅ [DB] Nagranie ${recording.id} zapisane`);
                resolve();
            };
            
            request.onerror = () => {
                console.error(`❌ [DB] Błąd zapisu nagrania ${recording.id}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getRecordings() {
        console.log('📖 [DB] Pobieranie wszystkich nagrań');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['recordings'], 'readonly');
            const store = transaction.objectStore('recordings');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const recordings = request.result.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log(`📊 [DB] Pobrano ${recordings.length} nagrań`);
                resolve(recordings);
            };
            
            request.onerror = () => {
                console.error('❌ [DB] Błąd pobierania nagrań:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteRecording(id) {
        console.log(`🗑️ [DB] Usuwanie nagrania ID: ${id}`);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['recordings'], 'readwrite');
            const store = transaction.objectStore('recordings');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`✅ [DB] Nagranie ${id} usunięte`);
                resolve();
            };
            
            request.onerror = () => {
                console.error(`❌ [DB] Błąd usuwania nagrania ${id}:`, request.error);
                reject(request.error);
            };
        });
    }

    async saveTitle(recordingId, title) {
        console.log(`💾 [DB] Zapisuję tytuł dla ${recordingId}: "${title}"`);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['titles'], 'readwrite');
            const store = transaction.objectStore('titles');
            const request = store.put({ recordingId, title });
            
            request.onsuccess = () => {
                console.log(`✅ [DB] Tytuł zapisany dla ${recordingId}`);
                resolve();
            };
            
            request.onerror = () => {
                console.error(`❌ [DB] Błąd zapisu tytułu dla ${recordingId}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getTitle(recordingId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['titles'], 'readonly');
            const store = transaction.objectStore('titles');
            const request = store.get(recordingId);
            
            request.onsuccess = () => {
                const result = request.result?.title || null;
                console.log(`🔍 [DB] Tytuł dla ${recordingId}: "${result}"`);
                resolve(result);
            };
            
            request.onerror = () => {
                console.error(`❌ [DB] Błąd pobierania tytułu dla ${recordingId}:`, request.error);
                reject(request.error);
            };
        });
    }

    async saveBackup(backup) {
        console.log(`💾 [DB] Zapisuję backup ID: ${backup.id}`);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.put(backup);
            
            request.onsuccess = () => {
                console.log(`✅ [DB] Backup ${backup.id} zapisany`);
                resolve();
            };
            
            request.onerror = () => {
                console.error(`❌ [DB] Błąd zapisu backupu ${backup.id}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getBackup() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const backups = request.result;
                const latestBackup = backups.length > 0 ? backups[backups.length - 1] : null;
                console.log(`📖 [DB] Pobrano ${backups.length} backupów, najnowszy: ${latestBackup?.id || 'brak'}`);
                resolve(latestBackup);
            };
            
            request.onerror = () => {
                console.error('❌ [DB] Błąd pobierania backupów:', request.error);
                reject(request.error);
            };
        });
    }

    async clearBackups() {
        console.log('🧹 [DB] Czyszczenie backupów');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ [DB] Backupy wyczyszczone');
                resolve();
            };
            
            request.onerror = () => {
                console.error('❌ [DB] Błąd czyszczenia backupów:', request.error);
                reject(request.error);
            };
        });
    }
}

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
        this.titleGenerationTimeout = null;
        this.isGeneratingTitle = false;
        this.db = new VawikDB();
        
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
        console.log('🚀 [INIT] Inicjalizacja aplikacji');
        
        // Inicjalizuj IndexedDB
        try {
            await this.db.init();
            console.log('✅ [INIT] Baza danych gotowa');
        } catch (error) {
            console.error('❌ [INIT] Błąd inicjalizacji bazy danych:', error);
            alert('Błąd inicjalizacji bazy danych. Aplikacja może nie działać poprawnie.');
        }
        
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
        await this.checkForInterruptedRecording();
        
        await this.loadRecordings();
        
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
            
            // Stan nagrywania jest automatycznie zarządzany przez backupy w IndexedDB
            
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
            this.startTitleGeneration();
            
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
        
        if (this.titleGenerationTimeout) {
            clearTimeout(this.titleGenerationTimeout);
            this.titleGenerationTimeout = null;
        }
        
        this.updateUI();
    }
    
    updateUI() {
        if (this.isRecording) {
            this.recordButton.className = 'w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-3xl cursor-pointer shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 flex items-center justify-center border-4 border-white/10 animate-pulse-scale';
            this.recordButton.innerHTML = '⏹';
            this.updateRecordingTitle(); // Użyj inteligentnego tytułu
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
        
        // Konwersja do base64 dla IndexedDB
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Audio = reader.result.split(',')[1];
            
            // Sprawdź czy mamy wygenerowany tytuł
            const generatedTitle = await this.getRecordingTitle(this.currentRecordingId || Date.now());
            
            const recording = {
                id: this.currentRecordingId || Date.now(),
                name: generatedTitle || `Nagranie ${new Date().toLocaleString('pl-PL')}`,
                date: new Date().toISOString(),
                duration: duration,
                audio: base64Audio,
                mimeType: audioBlob.type,
                corrupted: false
            };
            
            await this.saveToDatabase(recording);
            await this.loadRecordings();
            
            // Wyczyść backup po udanym zapisaniu
            await this.clearRecordingState();
            
            this.status.textContent = `Nagranie zapisane (${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')})`;
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    async saveToDatabase(recording) {
        try {
            await this.db.saveRecording(recording);
            console.log(`✅ [SAVE] Nagranie ${recording.id} zapisane w IndexedDB`);
        } catch (error) {
            console.error(`❌ [SAVE] Błąd zapisu nagrania ${recording.id}:`, error);
            throw error;
        }
    }
    
    async loadRecordings() {
        try {
            const recordings = await this.db.getRecordings();
            
            if (recordings.length === 0) {
                this.recordingsList.innerHTML = '<div class="text-center pb-10 text-gray-500 italic">Brak nagrań</div>';
                return;
            }
            
            console.log(`📂 [LOAD] Ładowanie ${recordings.length} nagrań do interfejsu`);
            
            const recordingsHTML = await Promise.all(recordings.map(async recording => {
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
                
                // Sprawdź czy mamy wygenerowany tytuł dla tego nagrania
                const recordingTitle = await this.db.getTitle(recording.id);
                const displayTitle = recordingTitle || (recording.transcription ? recording.transcription.substring(0, 60) + (recording.transcription.length > 60 ? '...' : '') : 'Brak transkrypcji');
                
                return `
                <div class="w-full bg-white/5 backdrop-blur-sm rounded-xl py-4 px-5 mb-2 border ${corruptedClasses} flex justify-between items-center transition-all duration-200 hover:bg-white/8 hover:border-navigator-purple/30 hover:shadow-lg hover:shadow-black/10 cursor-pointer" onclick="recorder.openTranscriptionView('${recording.id}')">
                    <div class="flex-1 text-left">
                        <div class="text-sm text-gray-100 mb-1">
                            ${displayTitle}
                        </div>
                        <div class="text-xs text-gray-400">
                            ${Math.floor(recording.duration/60)}:${(recording.duration%60).toString().padStart(2, '0')} - ${recording.name.replace('Nagranie ', '')}
                            ${recording.corrupted ? ' • ODZYSKANE' : ''}
                        </div>
                    </div>
                    <div class="flex gap-1 items-center ml-auto">
                        ${recording.transcription ? '<span class="text-emerald-400 text-lg">📄</span>' : 
                          recording.transcribing ? '<span class="text-gray-400 text-lg">⏳</span>' : 
                          '<span class="text-navigator-purple text-lg">🎤</span>'}
                    </div>
                </div>`;
            }));
            
            this.recordingsList.innerHTML = recordingsHTML.join('');
            
        } catch (error) {
            console.error('❌ [LOAD] Błąd ładowania nagrań:', error);
            this.recordingsList.innerHTML = '<div class="text-center pb-10 text-red-500 italic">Błąd ładowania nagrań</div>';
        }
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
        reader.onload = async () => {
            const base64Audio = reader.result.split(',')[1];
            
            const backup = {
                id: this.currentRecordingId,
                chunks: base64Audio,
                startTime: this.startTime,
                duration: currentDuration,
                mimeType: audioBlob.type,
                timestamp: Date.now()
            };
            
            await this.db.saveBackup(backup);
            console.log(`📦 [BACKUP] Backup zapisany: ${currentDuration}s`);
        };
        
        reader.readAsDataURL(audioBlob);
    }
    
    // Funkcja usunięta - state zarządzany przez IndexedDB
    
    async clearRecordingState() {
        await this.db.clearBackups();
        console.log('🧹 [BACKUP] Stan nagrywania wyczyszczony');
    }
    
    async checkForInterruptedRecording() {
        try {
            const backup = await this.db.getBackup();
            
            if (backup) {
                console.log(`🔍 [BACKUP] Znaleziono backup: ${backup.duration}s`);
                
                // Sprawdź czy backup ma więcej niż 5 sekund (oznacza przerwane nagranie)
                if (backup.duration >= 5) {
                    console.log('🔧 [BACKUP] Backup wystarczająco długi - dodaję jako uszkodzone nagranie');
                    // Automatycznie dodaj do listy jako uszkodzone nagranie
                    await this.addCorruptedRecording(backup);
                }
                
                // Wyczyść backup po sprawdzeniu
                await this.db.clearBackups();
                console.log('🧹 [BACKUP] Backup sprawdzony i wyczyszczony');
            }
        } catch (error) {
            console.error('❌ [BACKUP] Błąd sprawdzania przerwanego nagrania:', error);
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
    
    async addCorruptedRecording(backup) {
        try {
            // Sprawdź czy to nagranie już nie istnieje
            const existingRecordings = await this.db.getRecordings();
            const exists = existingRecordings.find(r => r.id === backup.id);
            
            if (exists) {
                console.log('🔍 [BACKUP] Nagranie już istnieje, pomijam odzyskiwanie');
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
            reader.onload = async () => {
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
                
                await this.saveToDatabase(recording);
                this.status.textContent = `Odzyskano przerwane nagranie (${Math.floor(backup.duration/60)}:${(backup.duration%60).toString().padStart(2, '0')})`;
            };
            
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('❌ [BACKUP] Błąd dodawania uszkodzonego nagrania:', error);
        }
    }
    
    async transcribeRecording(id) {
        try {
            const recordings = await this.db.getRecordings();
            const recording = recordings.find(r => r.id.toString() === id);
            
            if (!recording) {
                this.status.textContent = 'Nie znaleziono nagrania';
                return;
            }
            
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
            recording.transcribing = true;
            await this.db.saveRecording(recording);
            await this.loadRecordings();
            
            this.status.textContent = 'Wysyłam do OpenAI Whisper...';
            
            // Transkrypcja Whisper
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
            recording.transcription = transcriptionText.trim();
            recording.transcribing = false;
            await this.db.saveRecording(recording);
            await this.loadRecordings();
            
            this.status.textContent = 'Transkrypcja ukończona!';
            
        } catch (error) {
            console.error('Błąd transkrypcji:', error);
            
            // Usuń flagę transkrypcji w przypadku błędu
            recording.transcribing = false;
            await this.db.saveRecording(recording);
            await this.loadRecordings();
            
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
    
    async openTranscriptionView(id) {
        try {
            const recordings = await this.db.getRecordings();
            const recording = recordings.find(r => r.id.toString() === id);
            
            if (!recording) {
                this.status.textContent = 'Nie znaleziono nagrania';
                return;
            }
        
        // Wypełnij dane
        document.getElementById('transcriptionTitle').textContent = `Transkrypcja: ${recording.name}`;
        
            // Sprawdź czy mamy wygenerowany tytuł dla tego nagrania
            const recordingTitle = await this.getRecordingTitle(recording.id) || 'Brak tytułu';
        
        document.getElementById('transcriptionMetadata').innerHTML = `
            <strong>Tytuł nagrania:</strong> ${recordingTitle}<br>
            <strong>Data:</strong> ${new Date(recording.date).toLocaleString('pl-PL')}<br>
            <strong>Czas trwania:</strong> ${Math.floor(recording.duration/60)}:${(recording.duration%60).toString().padStart(2, '0')}<br>
            <strong>Status:</strong> ${recording.corrupted ? 'Odzyskane' : 'Kompletne'}
        `;
        
        document.getElementById('transcriptionContent').textContent = recording.transcription || 'Brak transkrypcji. Kliknij przycisk "Transkrybuj" poniżej aby rozpocząć transkrypcję tego nagrania.';
        
        // Skonfiguruj przyciski
        const playBtn = document.getElementById('playRecordingBtn');
        const transcribeBtn = document.getElementById('transcribeRecordingBtn');
        const downloadBtn = document.getElementById('downloadRecordingBtn');
        const deleteBtn = document.getElementById('deleteRecordingBtn');
        const transcribeIcon = document.getElementById('transcribeIcon');
        const transcribeText = document.getElementById('transcribeText');
        
        // Przycisk odtwarzania
        playBtn.onclick = () => this.playRecording(id);
        
        // Przycisk pobierania
        downloadBtn.onclick = () => this.downloadRecording(id);
        
        // Przycisk usuwania
        deleteBtn.onclick = () => this.deleteRecording(id);
        
        // Przycisk transkrypcji
        if (recording.transcribing) {
            transcribeIcon.textContent = '⏳';
            transcribeText.textContent = 'Transkrybowanie...';
            transcribeBtn.disabled = true;
            transcribeBtn.className = 'py-3 px-6 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 font-medium cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2';
        } else if (recording.transcription) {
            transcribeIcon.textContent = '🔄';
            transcribeText.textContent = 'Transkrybuj ponownie';
            transcribeBtn.disabled = false;
            transcribeBtn.className = 'py-3 px-6 rounded-lg bg-navigator-purple/20 border border-navigator-purple/30 text-purple-300 font-medium cursor-pointer transition-all duration-300 hover:bg-navigator-purple/30 hover:border-navigator-purple/50 active:scale-95 flex items-center justify-center gap-2';
            transcribeBtn.onclick = async () => {
                // Usuń istniejącą transkrypcję i rozpocznij nową
                const updatedRecordings = await this.db.getRecordings();
                const currentRecording = updatedRecordings.find(r => r.id.toString() === id);
                if (currentRecording) {
                    delete currentRecording.transcription;
                    await this.db.saveRecording(currentRecording);
                }
                await this.transcribeRecording(id);
                await this.openTranscriptionView(id); // Odśwież widok
            };
        } else {
            transcribeIcon.textContent = '🎤';
            transcribeText.textContent = 'Transkrybuj';
            transcribeBtn.disabled = false;
            transcribeBtn.className = 'py-3 px-6 rounded-lg bg-navigator-purple/20 border border-navigator-purple/30 text-purple-300 font-medium cursor-pointer transition-all duration-300 hover:bg-navigator-purple/30 hover:border-navigator-purple/50 active:scale-95 flex items-center justify-center gap-2';
            transcribeBtn.onclick = async () => {
                await this.transcribeRecording(id);
                await this.openTranscriptionView(id); // Odśwież widok
            };
        }
        
        // Pokaż pełnoekranowy widok
        const fullscreen = document.getElementById('transcriptionFullscreen');
        fullscreen.className = 'fixed inset-0 w-full h-full bg-gradient-to-br from-navigator-dark via-navigator-mid to-navigator-blue z-[1000] flex flex-col p-5 overflow-y-auto';
        
            // Zablokuj scrollowanie body
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('❌ [VIEW] Błąd otwierania widoku transkrypcji:', error);
            this.status.textContent = 'Błąd otwierania widoku transkrypcji';
        }
    }
    
    closeTranscriptionView() {
        // Ukryj pełnoekranowy widok
        const fullscreen = document.getElementById('transcriptionFullscreen');
        fullscreen.className = 'fixed inset-0 w-full h-full bg-gradient-to-br from-navigator-dark via-navigator-mid to-navigator-blue z-[1000] hidden flex-col p-5 overflow-y-auto';
        
        // Przywróć scrollowanie body
        document.body.style.overflow = 'auto';
    }
    
    async deleteRecording(id) {
        try {
            const recordings = await this.db.getRecordings();
            const recording = recordings.find(r => r.id.toString() === id);
            
            if (!recording) {
                this.status.textContent = 'Nie znaleziono nagrania';
                return;
            }
            
            const confirmMessage = `Czy na pewno chcesz usunąć nagranie?\n\n"${recording.name}"\nCzas trwania: ${Math.floor(recording.duration/60)}:${(recording.duration%60).toString().padStart(2, '0')}`;
            
            if (confirm(confirmMessage)) {
                // Usuń nagranie z bazy danych
                await this.db.deleteRecording(id);
                console.log(`🗑️ [DELETE] Nagranie ${id} usunięte z IndexedDB`);
                
                // Zamknij widok transkrypcji
                this.closeTranscriptionView();
                
                // Odśwież listę nagrań
                await this.loadRecordings();
                
                this.status.textContent = 'Nagranie zostało usunięte';
                setTimeout(() => {
                    this.status.textContent = 'Dotknij aby nagrać';
                }, 2000);
            }
        } catch (error) {
            console.error('❌ [DELETE] Błąd usuwania nagrania:', error);
            this.status.textContent = 'Błąd usuwania nagrania';
        }
    }
    
    async downloadRecording(id) {
        try {
            const recordings = await this.db.getRecordings();
            const recording = recordings.find(r => r.id.toString() === id);
            
            if (!recording) {
                this.status.textContent = 'Nie znaleziono nagrania';
                return;
            }
            
            // Konwersja base64 z powrotem do blob
            // Konwersja base64 z powrotem do blob
            const byteCharacters = atob(recording.audio);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: recording.mimeType });
            
            // Utwórz URL i link do pobrania
            const audioUrl = URL.createObjectURL(audioBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            
            // Nazwa pliku z datą
            const date = new Date(recording.date);
            const fileName = `vawik_nagranie_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}.webm`;
            
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            
            // Dodaj do DOM, kliknij i usuń
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Zwolnij URL
            URL.revokeObjectURL(audioUrl);
            
            this.status.textContent = 'Nagranie zostało pobrane';
            setTimeout(() => {
                this.status.textContent = 'Dotknij aby nagrać';
            }, 2000);
            
        } catch (error) {
            console.error('❌ [DOWNLOAD] Błąd pobierania nagrania:', error);
            this.status.textContent = 'Błąd pobierania nagrania';
        }
    }
    
    startTitleGeneration() {
        console.log('📝 [TITLE] Ustawienie timera na 5 sekund dla generowania tytułu');
        // Po 5 sekundach wygeneruj tytuł z pierwszych 5 sekund nagrania
        this.titleGenerationTimeout = setTimeout(async () => {
            console.log('⏰ [TITLE] Timer 5s uruchomiony - sprawdzanie warunków');
            console.log(`📊 [TITLE] isRecording: ${this.isRecording}, audioChunks: ${this.audioChunks.length}`);
            
            if (this.isRecording && this.audioChunks.length > 0) {
                console.log('✅ [TITLE] Warunki spełnione - rozpoczynam generowanie tytułu');
                this.isGeneratingTitle = true;
                this.updateRecordingTitle();
                await this.generateTitleFromCurrentAudio();
            } else {
                console.log('❌ [TITLE] Warunki nie spełnione - pomijam generowanie tytułu');
            }
        }, 5000);
    }
    
    async generateTitleFromCurrentAudio() {
        console.log('🎬 [TITLE] Rozpoczynam generowanie tytułu z audio');
        try {
            // Utwórz fragment z pierwszych 5 sekund
            const audioBlob = new Blob(this.audioChunks.slice(0, 5), { type: 'audio/webm' });
            console.log(`📦 [TITLE] Utworzono blob z ${this.audioChunks.length} chunków, rozmiar: ${audioBlob.size} bajtów`);
            
            if (audioBlob.size === 0) {
                console.log('🔇 [TITLE] Audio blob pusty - ustawiam tytuł "Nagranie ciche"');
                this.setRecordingTitle('Nagranie ciche');
                return;
            }
            
            // Sprawdź klucz API
            const apiKey = this.getOpenAIKey();
            console.log(`🔑 [TITLE] Sprawdzanie klucza API: ${apiKey ? 'JEST' : 'BRAK'}`);
            if (!apiKey) {
                console.log('❌ [TITLE] Brak klucza API - używam domyślnego tytułu');
                this.setRecordingTitle(`Nagranie ${new Date().toLocaleString('pl-PL')}`);
                return;
            }
            
            // Wyślij do Whisper API
            console.log('🎤 [TITLE] Przygotowuję wysyłkę do Whisper API');
            const formData = new FormData();
            formData.append('file', audioBlob, `title_fragment_${this.currentRecordingId}.webm`);
            formData.append('model', 'whisper-1');
            formData.append('language', 'pl');
            formData.append('response_format', 'text');
            
            console.log('📡 [TITLE] Wysyłam do Whisper API...');
            const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });
            
            console.log(`📥 [TITLE] Odpowiedź Whisper API: status ${whisperResponse.status}`);
            
            if (!whisperResponse.ok) {
                const errorText = await whisperResponse.text();
                console.error(`❌ [TITLE] Błąd Whisper API: ${whisperResponse.status} - ${errorText}`);
                throw new Error(`Whisper API error: ${whisperResponse.status}`);
            }
            
            const transcriptionText = await whisperResponse.text();
            console.log(`📝 [TITLE] Otrzymana transkrypcja: "${transcriptionText}"`);
            
            if (!transcriptionText.trim()) {
                console.log('🔇 [TITLE] Pusta transkrypcja - ustawiam "Nagranie bez słów"');
                this.setRecordingTitle('Nagranie bez słów');
                return;
            }
            
            // Wyślij do GPT-4o-nano dla wygenerowania tytułu
            console.log('🤖 [TITLE] Wysyłam transkrypcję do GPT-4o-nano');
            const title = await this.generateTitleWithGPT(transcriptionText.trim());
            console.log(`📄 [TITLE] Otrzymany tytuł: "${title}"`);
            this.setRecordingTitle(title);
            
        } catch (error) {
            console.error('❌ [TITLE] Błąd generowania tytułu:', error);
            console.error('❌ [TITLE] Stack trace:', error.stack);
            this.setRecordingTitle(`Nagranie ${new Date().toLocaleString('pl-PL')}`);
        } finally {
            console.log('🏁 [TITLE] Zakończono proces generowania tytułu');
            this.isGeneratingTitle = false;
            this.updateRecordingTitle();
        }
    }
    
    async generateTitleWithGPT(transcription) {
        console.log(`🤖 [GPT] Rozpoczynam generowanie tytułu dla transkrypcji: "${transcription.substring(0, 100)}..."`);
        try {
            const apiKey = this.getOpenAIKey();
            console.log(`🔑 [GPT] Użycie klucza API: ${apiKey ? 'JEST' : 'BRAK'}`);
            
            const payload = {
                model: 'gpt-4.1-nano',
                messages: [{
                    role: 'user',
                    content: `Na podstawie tej transkrypcji stwórz krótki, opisowy tytuł (max 50 znaków):\n\n${transcription}\n\nOdpowiedz tylko tytułem, bez dodatkowego tekstu.`
                }],
                max_tokens: 20,
                temperature: 0.7
            };
            
            console.log('📡 [GPT] Wysyłam request do GPT-4.1-nano:', JSON.stringify(payload, null, 2));
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });
            
            console.log(`📥 [GPT] Odpowiedź API: status ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [GPT] Błąd API: ${response.status} - ${errorText}`);
                throw new Error(`GPT API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📄 [GPT] Pełna odpowiedź:', JSON.stringify(data, null, 2));
            
            const title = data.choices[0]?.message?.content?.trim();
            console.log(`✅ [GPT] Wyciągnięty tytuł: "${title}"`);
            
            return title || `Nagranie ${new Date().toLocaleString('pl-PL')}`;
            
        } catch (error) {
            console.error('❌ [GPT] Błąd GPT API:', error);
            console.error('❌ [GPT] Stack trace:', error.stack);
            return `Nagranie ${new Date().toLocaleString('pl-PL')}`;
        }
    }
    
    async setRecordingTitle(title) {
        console.log(`💾 [TITLE] Zapisuję tytuł "${title}" dla nagrania ${this.currentRecordingId}`);
        try {
            await this.db.saveTitle(this.currentRecordingId, title);
            console.log('💾 [TITLE] Tytuł zapisany w IndexedDB');
            
            // Natychmiast zaktualizuj interfejs
            this.updateRecordingTitle();
        } catch (error) {
            console.error('❌ [TITLE] Błąd zapisu tytułu:', error);
        }
    }
    
    async getRecordingTitle(id) {
        try {
            const title = await this.db.getTitle(id);
            console.log(`🔍 [TITLE] Pobieranie tytułu dla ${id}: "${title}"`);
            return title;
        } catch (error) {
            console.error(`❌ [TITLE] Błąd pobierania tytułu dla ${id}:`, error);
            return null;
        }
    }
    
    async updateRecordingTitle() {
        if (!this.isRecording) return;
        
        const currentTitle = await this.getRecordingTitle(this.currentRecordingId);
        console.log(`🔄 [TITLE] Aktualizacja interfejsu - isGeneratingTitle: ${this.isGeneratingTitle}, currentTitle: "${currentTitle}"`);
        
        if (this.isGeneratingTitle) {
            this.status.textContent = 'Nagrywanie... (tworzenie tytułu)';
            console.log('🔄 [TITLE] Status: Nagrywanie... (tworzenie tytułu)');
        } else if (currentTitle) {
            this.status.textContent = `Nagrywanie: ${currentTitle}`;
            console.log(`🔄 [TITLE] Status: Nagrywanie: ${currentTitle}`);
        } else {
            this.status.textContent = 'Nagrywanie...';
            console.log('🔄 [TITLE] Status: Nagrywanie...');
        }
    }
}

// Inicjalizacja aplikacji
let recorder;
document.addEventListener('DOMContentLoaded', () => {
    recorder = new AudioRecorder();
});

// Dodatkowe wsparcie dla iOS
document.addEventListener('touchstart', function() {}, { passive: true });