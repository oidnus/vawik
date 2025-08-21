# CLAUDE.md - Konfiguracja projektu Vawik

## Informacje o projekcie
- **Nazwa**: Vawik
- **Opis**: Nagraj swoje myśli - aplikacja do nagrywania audio z transkrypcją
- **Technologie**: HTML, JavaScript, IndexedDB, OpenAI Whisper API

## Numeracja wersji
- **Format**: 0.X.Y
  - `0` - zawsze na początku
  - `X` - wersja zmieniona przez użytkownika
  - `Y` - wersja zmieniona przez Claude (zwiększana przy każdej mojej zmianie)


## Funkcjonalności
- ✅ Nagrywanie audio z mikrofonem
- ✅ Automatyczny backup co N sekund (konfigurowalny)
- ✅ Zapis w IndexedDB z nieograniczoną pamięcią
- ✅ Transkrypcja z OpenAI Whisper API
- ✅ Automatyczne generowanie tytułów nagrań z AI
- ✅ Limit czasu nagrywania (konfigurowalny)
- ✅ Automatyczne usuwanie najstarszych nagrań przy przekroczeniu limitu
- ✅ Odzyskiwanie przerwanych nagrań
- ✅ Pobieranie nagrań w formacie WebM
- ✅ Responsywny interfejs z Tailwind CSS

## Struktura bazy danych (IndexedDB)
- **recordings**: Główne nagrania audio
- **titles**: Wygenerowane tytuły nagrań
- **backups**: Tymczasowe backupy podczas nagrywania

## Komendy deweloperskie
- Brak - aplikacja działa w przeglądarce
- Service Worker dla PWA
