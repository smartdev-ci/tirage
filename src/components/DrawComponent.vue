<template>
  <div class="card">
    <h2>🎯 Tirage au sort</h2>

    <label for="userSelect">Sélectionnez votre nom :</label>
    <select v-model="selectedUser" id="userSelect" :disabled="nameLocked">
      <option disabled value="">-- Choisissez --</option>
      <option v-for="user in users" :key="user">{{ user }}</option>
    </select>

    <button @click="drawName" :disabled="!selectedUser || nameLocked && !result">
      🎲 Tirer un nom
    </button>

    <div v-if="result" class="result" :class="alreadyDrawn ? 'warning' : 'success'">
      <p v-if="alreadyDrawn">Vous avez déjà tiré : <strong>{{ result }}</strong></p>
      <p v-else>Vous avez tiré : <strong>{{ result }}</strong></p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        "Alice","Bob","Charlie","David","Emma","Fanny","Georges",
        "Hugo","Isabelle","Jean","Karim","Laura","Marc","Nina"
      ],
      selectedUser: "",
      result: "",
      alreadyDrawn: false,
      draws: {},
      nameLocked: false
    };
  },
  mounted() {
    const savedDraws = localStorage.getItem('draws');
    const savedName = localStorage.getItem('selectedUser');
    const locked = localStorage.getItem('nameLocked');

    if (savedDraws) {
      this.draws = JSON.parse(savedDraws);
    }
    if (savedName) {
      this.selectedUser = savedName;
    }
    if (locked === "true") {
      this.nameLocked = true;
    }
  },
  methods: {
    drawName() {
      if (this.draws[this.selectedUser]) {
        this.result = this.draws[this.selectedUser];
        this.alreadyDrawn = true;
        this.nameLocked = true;
        localStorage.setItem('nameLocked', "true");
        return;
      }

      const alreadyPicked = Object.values(this.draws);
      const candidates = this.users.filter(
        user => user !== this.selectedUser && !alreadyPicked.includes(user)
      );

      if (candidates.length === 0) {
        alert("Aucun nom disponible à tirer !");
        return;
      }

      const drawn = candidates[Math.floor(Math.random() * candidates.length)];
      this.draws[this.selectedUser] = drawn;
      localStorage.setItem('draws', JSON.stringify(this.draws));

      this.result = drawn;
      this.alreadyDrawn = false;

      // 🔒 Verrouiller le nom choisi
      this.nameLocked = true;
      localStorage.setItem('selectedUser', this.selectedUser);
      localStorage.setItem('nameLocked', "true");
    }
  }
};
</script>

<style>
.card {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px 25px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  text-align: center;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

select {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-bottom: 15px;
  font-size: 14px;
}

select:disabled {
  background-color: #f3f3f3;
  color: #666;
}

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: 0.3s;
}

button:hover:not(:disabled) {
  background: linear-gradient(45deg, #45a049, #4CAF50);
  transform: translateY(-1px);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
}

.success {
  background-color: #e6f7e6;
  color: #2e7d32;
  border: 1px solid #81c784;
}

.warning {
  background-color: #fff4e5;
  color: #e65100;
  border: 1px solid #ffb74d;
}
</style>
