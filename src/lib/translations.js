// Scoped translation system — covers core navigation, buttons, and key labels ONLY,
// not every post/message/comment (which would be a much bigger, different undertaking
// and can't be reliably auto-translated anyway). This is intentionally small and honest
// about its limits: switching language changes the app's own UI text, not user content.

export const LANGUAGES = { en: "English", fr: "Français" };

const DICT = {
  en: {
    feed: "Feed", messages: "Messages", rooms: "Rooms & Groups", marketplace: "Marketplace",
    embassy: "Embassy", calls: "Calls", people: "People", myProfile: "My Profile",
    signIn: "Sign In", signOut: "Sign Out", createAccount: "Create Account",
    email: "Email Address", password: "Password", fullName: "Full Name",
    save: "Save", cancel: "Cancel", post: "Post", send: "Send", search: "Search",
    settings: "Settings", editProfile: "Edit Profile", welcomeBack: "Welcome back",
    home: "Home", chat: "Chat", darkMode: "Dark Mode", lightMode: "Light Mode",
    notifications: "Notifications", noNotificationsYet: "No notifications yet",
  },
  fr: {
    feed: "Fil d'actualité", messages: "Messages", rooms: "Salons & Groupes", marketplace: "Marché",
    embassy: "Ambassade", calls: "Appels", people: "Personnes", myProfile: "Mon Profil",
    signIn: "Se connecter", signOut: "Se déconnecter", createAccount: "Créer un compte",
    email: "Adresse e-mail", password: "Mot de passe", fullName: "Nom complet",
    save: "Enregistrer", cancel: "Annuler", post: "Publier", send: "Envoyer", search: "Rechercher",
    settings: "Paramètres", editProfile: "Modifier le profil", welcomeBack: "Bon retour",
    home: "Accueil", chat: "Discussion", darkMode: "Mode sombre", lightMode: "Mode clair",
    notifications: "Notifications", noNotificationsYet: "Aucune notification pour l'instant",
  },
};

export function getLang() {
  return localStorage.getItem("dl_lang") || "en";
}

export function setLang(lang) {
  localStorage.setItem("dl_lang", lang);
}

// t("feed") -> "Feed" or "Fil d'actualité" depending on saved preference. Falls back to
// the English string (or the key itself) if a translation is somehow missing, so the UI
// never shows a blank label even if the dictionary is incomplete for a given key.
export function t(key) {
  const lang = getLang();
  return DICT[lang]?.[key] || DICT.en[key] || key;
}
