<template>
  <div class="app-wrapper">
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="loading" key="loader" class="loader-screen">
        <div class="loader-hat">🎩</div>
        <p class="loader-text">Préparation du tirage...</p>
      </div>

      <div v-else-if="!authenticated" key="login" class="main-container">
        <header class="app-header">
          <div class="header-icon">🎩</div>
          <h1 class="app-title">Accès au tirage</h1>
        </header>

        <div class="login-card">
          <label class="login-label" for="loginCode">Code secret</label>
          <input id="loginCode" v-model="loginCode" class="login-input" type="password"
            placeholder="Entrez votre code secret" autocomplete="off" />

          <p v-if="authError" class="auth-error">{{ authError }}</p>

          <button @click="login" :disabled="!canLogin" class="btn btn-primary login-btn">
            🔐 Accéder au tirage
          </button>
        </div>
      </div>

      <div v-else-if="!hasPlayed && !rolling && !confirmVisible" key="selection" class="main-container">
        <header class="app-header">
          <div class="header-icon">🎩</div>
          <h1 class="app-title">LISTE DES PARTICIPANTS</h1>
        </header>

        <div class="actions-bar">
          <p class="action-hint">Cliquez ici pour effectuer votre tirage</p>
          <button @click="openConfirm" :disabled="!selectedUser" class="btn btn-primary">
            🎲 Je suis prêt
          </button>
        </div>

        <div class="cards-grid">
          <div v-for="user in users" :key="user" class="user-card" :class="selectedUser === user ? 'selected' : ''"
            @click="selectUser(user)">
            <div class="card-avatar">{{ user.charAt(0) }}</div>
            <div class="card-name">{{ user }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="rolling" key="rolling" class="rolling-display">
        <span class="rolling-emoji">🎰</span>
        <span class="rolling-name">Tirage en cours...</span>
      </div>

      <div v-else-if="selectedUser && result && !rolling" key="result-only" class="result-only-view">
        <p class="result-only-text">Votre tirage a été effectué</p>
        <button @click="revealResult = true" class="btn btn-primary">
          👁️ Voir mon tirage
        </button>
      </div>

      <div v-else-if="!hasPlayed" key="empty" class="main-container">
        <header class="app-header">
          <div class="header-icon">🎩</div>
          <h1 class="app-title">LISTE DES PARTICIPANTS</h1>
        </header>

        <div class="actions-bar">
          <p class="action-hint">Cliquez ici pour effectuer votre tirage</p>
          <button @click="openConfirm" :disabled="!selectedUser" class="btn btn-primary">
            🎲 Je suis prêt
          </button>
        </div>

        <div class="cards-grid">
          <div v-for="user in users" :key="user" class="user-card" :class="selectedUser === user ? 'selected' : ''"
            @click="selectUser(user)">
            <div class="card-avatar">{{ user.charAt(0) }}</div>
            <div class="card-name">{{ user }}</div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="confirmVisible" class="confirm-modal" @click.self="confirmVisible = false">
        <div class="confirm-modal-content">
          <p class="confirm-text">
            Bonjour <strong>{{ selectedUser }}</strong>, es-tu prêt pour le tirage ?
          </p>
          <div class="confirm-actions">
            <button @click="startDraw" class="btn btn-primary">Oui</button>
            <button @click="confirmVisible = false" class="btn btn-ghost">Non</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="selectErrorVisible" class="confirm-modal" @click.self="selectErrorVisible = false">
        <div class="confirm-modal-content">
          <p class="confirm-text">{{ selectError }}</p>
          <div class="confirm-actions">
            <button @click="selectErrorVisible = false" class="btn btn-primary">OK</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="revealResult && result" class="result-modal" @click.self="revealResult = false">
        <div class="result-modal-content">
          <div class="result-modal-icon">🎉</div>
          <p class="result-modal-text">
            {{ selectedUser }}, vous avez tiré : <strong>{{ result }}</strong>
          </p>
          <button @click="revealResult = false" class="btn btn-ghost result-modal-close">
            Masquer
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { supabase } from '../utils/supabase';

export default defineComponent({
  data() {
    return {
      users: ["Aristide", "Hermann", "Cinthya", "Mireille", "Clara", "Tonton Clovis", "Paulin", "Esdras"],
      selectedUser: localStorage.getItem('selectedUser') || "",
      result: "",
      rolling: false,
      rollingName: "",
      loading: true,
      confirmVisible: false,
      revealResult: false,
      hasPlayed: false,
      authenticated: false,
      loginCode: "",
      authError: "",
      selectError: "",
      selectErrorVisible: false
    };
  },
  computed: {
    canLogin() {
      return this.loginCode.trim().length > 0;
    }
  },
  mounted() {
    this.attemptAutoLogin();
    this.checkExistingDraw();
    setTimeout(() => {
      this.loading = false;
    }, 1200);
  },
  methods: {
    async attemptAutoLogin() {
      const savedUser = localStorage.getItem('selectedUser');
      if (!savedUser) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('participants')
          .select('name')
          .eq('name', savedUser)
          .single();

        if (!error && data) {
          this.selectedUser = data.name;
          this.authenticated = true;

          const { data: existingDraw, error: drawError } = await supabase
            .from('draws')
            .select('drawn')
            .eq('drawer', data.name)
            .single();

          if (!drawError && existingDraw) {
            this.result = existingDraw.drawn;
            this.hasPlayed = true;
            localStorage.setItem('nameLocked', 'true');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la connexion automatique', error);
      }
    },
    async checkExistingDraw() {
      const nameLocked = localStorage.getItem('nameLocked');
      if (nameLocked === 'true' && this.selectedUser) {
        this.hasPlayed = true;
        try {
          const { data, error } = await supabase
            .from('draws')
            .select('drawn')
            .eq('drawer', this.selectedUser)
            .single();

          if (!error && data) {
            this.result = data.drawn;
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du tirage', error);
        }
      }
    },
    async login() {
      this.authError = "";

      try {
        const { data, error } = await supabase
          .from('participants')
          .select('name')
          .eq('access_code', this.loginCode.trim().toUpperCase())
          .single();

        if (error || !data) {
          this.authError = "Code secret incorrect.";
          return;
        }

        this.selectedUser = data.name;
        this.authenticated = true;
        localStorage.setItem('selectedUser', data.name);

        const { data: existingDraw, error: drawError } = await supabase
          .from('draws')
          .select('drawn')
          .eq('drawer', data.name)
          .single();

        if (!drawError && existingDraw) {
          this.result = existingDraw.drawn;
          this.hasPlayed = true;
          localStorage.setItem('nameLocked', 'true');
        }
      } catch (error) {
        console.error('Erreur lors de la connexion', error);
        this.authError = "Erreur serveur, veuillez réessayer.";
      }
    },
    selectUser(user) {
      if (this.hasPlayed) return;

      if (this.authenticated && user !== this.selectedUser) {
        this.selectError = "Ce nom ne correspond pas à votre code authentifié.";
        this.selectErrorVisible = true;
        this.result = "";
        this.revealResult = false;
        this.rolling = false;
        return;
      }

      this.selectError = "";
      this.selectErrorVisible = false;
      this.result = "";
      this.revealResult = false;
      this.rolling = false;
    },
    openConfirm() {
      if (!this.selectedUser || this.hasPlayed) return;
      this.confirmVisible = true;
    },
    async startDraw() {
      if (!this.selectedUser) return;

      this.confirmVisible = false;
      localStorage.setItem('selectedUser', this.selectedUser);

      try {
        const { data: existing, error: existingError } = await supabase
          .from('draws')
          .select('drawn')
          .eq('drawer', this.selectedUser)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError;
        }

        if (existing) {
          this.result = existing.drawn;
          this.hasPlayed = true;
          localStorage.setItem('nameLocked', 'true');
          return;
        }

        const { data: allDraws, error: drawsError } = await supabase
          .from('draws')
          .select('drawn');

        if (drawsError) throw drawsError;

        const pickedSet = new Set((allDraws || []).map(d => d.drawn));
        const forbiddenPairs = [
          ['Aristide', 'Paulin'],
          ['Paulin', 'Aristide']
        ];
        const candidates = this.users.filter(user => {
          if (user === this.selectedUser) return false;
          if (pickedSet.has(user)) return false;
          for (const [a, b] of forbiddenPairs) {
            if (this.selectedUser === a && user === b) return false;
            if (this.selectedUser === b && user === a) return false;
          }
          return true;
        });

        if (candidates.length === 0) {
          alert("Aucun nom disponible à tirer !");
          return;
        }

        const drawn = candidates[Math.floor(Math.random() * candidates.length)];

        this.rolling = true;
        this.result = "";

        const steps = 18;
        let count = 0;

        const interval = setInterval(() => {
          const randomName = candidates[Math.floor(Math.random() * candidates.length)];
          this.rollingName = randomName;
          count += 1;

          if (count >= steps) {
            clearInterval(interval);
            this.rolling = false;
            this.rollingName = "";
            this.result = drawn;
            this.hasPlayed = true;
            localStorage.setItem('nameLocked', 'true');
          }
        }, 80);

        const { error: insertError } = await supabase
          .from('draws')
          .insert({ drawer: this.selectedUser, drawn });

        if (insertError) {
          clearInterval(interval);
          this.rolling = false;
          alert(insertError.message || 'Erreur lors du tirage');
        }
      } catch (error) {
        console.error('Erreur lors du tirage', error);
        alert('Erreur serveur, veuillez reessayer');
      }
    }
  }
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  overflow-x: hidden;
}

.app-wrapper {
  position: relative;
  min-height: 100vh;
  padding: 40px 20px;
}

.bg-shapes {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(52, 211, 153, 0.08));
  top: -100px;
  right: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.06), rgba(251, 146, 60, 0.06));
  bottom: -50px;
  left: -50px;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(100, 116, 139, 0.05));
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.main-container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.loader-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  z-index: 100;
  gap: 20px;
}

.loader-hat {
  font-size: 64px;
  animation: hatFloat 2s ease-in-out infinite;
}

@keyframes hatFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

.loader-text {
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.5px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 40px;
}

.header-icon {
  font-size: 36px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.app-title {
  font-size: 32px;
  font-weight: 800;
  color: #0f766e;
  letter-spacing: -0.5px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  margin-top: 20px;
}

.user-card {
  background: white;
  border-radius: 20px;
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.user-card.selected {
  border-color: #0d9488;
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1), 0 12px 24px rgba(0, 0, 0, 0.08);
}

.card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  margin: 0 auto 14px;
  transition: all 0.3s ease;
}

.user-card.selected .card-avatar {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.card-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.actions-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  flex-direction: column;
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 50%;
  margin: 0 auto;
}

.btn-primary {
  background: #0d9488;
  color: white;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #0f766e;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.rolling-display {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  z-index: 150;
  gap: 20px;
}

.rolling-emoji {
  font-size: 48px;
  display: block;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.rolling-name {
  font-size: 24px;
  font-weight: 700;
  color: #0d9488;
  letter-spacing: 1px;
}

.result-only-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  z-index: 120;
  gap: 20px;
  text-align: center;
}

.result-only-text {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 420px;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
}

.login-label {
  display: block;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.login-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 15px;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.login-input:focus {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.auth-error {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 12px;
}

.action-hint {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-align: center;
  margin-bottom: 12px;
}

.login-btn {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.confirm-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.confirm-modal-content {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.confirm-text {
  font-size: 18px;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-text strong {
  color: #0d9488;
  font-size: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.result-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.result-modal-content {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.result-modal-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-modal-text {
  font-size: 18px;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 24px;
}

.result-modal-text strong {
  color: #0d9488;
  font-size: 22px;
}

.result-modal-close {
  margin: 0 auto;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .app-title {
    font-size: 26px;
  }

  .actions-bar {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .app-wrapper {
    padding: 24px 16px;
  }

  .user-card {
    padding: 24px 16px;
  }
}
</style>
