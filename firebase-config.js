// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDr3n8GwMgEW2j4yBL7m0yIpMKNcvIaCj0",
  authDomain: "ai-teaching-ideas-voting.firebaseapp.com",
  projectId: "ai-teaching-ideas-voting",
  storageBucket: "ai-teaching-ideas-voting.firebasestorage.app",
  messagingSenderId: "321877497959",
  appId: "1:321877497959:web:f6ba17e93cc5d820755cc2",
  measurementId: "G-KJ0NM9S8BG"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 참조
const db = firebase.firestore();

// 실시간 투표 데이터 관리
class VoteManager {
  constructor() {
    this.votesRef = db.collection('votes');
    this.adminPassword = '250709';
  }

  // 투표 추가
  async addVote(subject, cardId) {
    try {
      const docRef = this.votesRef.doc(`${subject}_${cardId}`);
      await docRef.set({
        subject: subject,
        cardId: cardId,
        count: firebase.firestore.FieldValue.increment(1),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('투표 추가 실패:', error);
      return false;
    }
  }

  // 투표 제거
  async removeVote(subject, cardId) {
    try {
      const docRef = this.votesRef.doc(`${subject}_${cardId}`);
      const doc = await docRef.get();
      
      if (doc.exists && doc.data().count > 0) {
        await docRef.update({
          count: firebase.firestore.FieldValue.increment(-1),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('투표 제거 실패:', error);
      return false;
    }
  }

  // 모든 투표 데이터 가져오기
  async getAllVotes() {
    try {
      const snapshot = await this.votesRef.get();
      const votes = {
        english: {},
        math: {}
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.subject && data.cardId) {
          if (!votes[data.subject][data.cardId]) {
            votes[data.subject][data.cardId] = 0;
          }
          votes[data.subject][data.cardId] = data.count || 0;
        }
      });
      
      return votes;
    } catch (error) {
      console.error('투표 데이터 가져오기 실패:', error);
      return { english: {}, math: {} };
    }
  }

  // 투표 초기화 (관리자 기능)
  async resetVotes(password) {
    if (password !== this.adminPassword) {
      throw new Error('관리자 비밀번호가 올바르지 않습니다.');
    }

    try {
      const snapshot = await this.votesRef.get();
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('투표 초기화 실패:', error);
      return false;
    }
  }

  // 실시간 투표 변경 감지
  onVotesChange(callback) {
    return this.votesRef.onSnapshot((snapshot) => {
      const votes = {
        english: {},
        math: {}
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.subject && data.cardId) {
          if (!votes[data.subject][data.cardId]) {
            votes[data.subject][data.cardId] = 0;
          }
          votes[data.subject][data.cardId] = data.count || 0;
        }
      });
      
      callback(votes);
    });
  }
}

// 전역 변수로 내보내기
window.VoteManager = VoteManager; 
