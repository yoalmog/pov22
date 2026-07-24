import sys

with open('src/components/AudioVisualizer.tsx', 'r') as f:
    content = f.read()

content = content.replace("""      } else {
        // Idle baseline state
        const now = Date.now();
        for (let i = 0; i < 128; i++) {
          const sineSignal = Math.sin(now * 0.001 + i * 0.15) * 0.01;
          amplitudeArray.push(sineSignal);
        }
      }""", """      } else {
        // Idle baseline state
        for (let i = 0; i < 128; i++) {
          amplitudeArray.push(0);
        }
      }""")

content = content.replace("""  const runDiagnostic = () => {
    setDiagState('TESTING');
    
    setTimeout(() => {
      setDiagState('PASS');
      setDiagMessageHe('אבחון הושלם בהצלחה! זוהה מתח היסט קבוע (DC bias) של ~1.65V במצב שקט, רמת רעש תרמי נמוכה מאוד (12mV RMS). המיקרופון תקין ומוכן לעבודה.');
      setDiagMessageEn('Diagnostic successful! DC offset bias of ~1.65V detected in silence, with low thermal noise (12mV RMS). The microphone module is correctly connected.');
    }, 1500);
  };""", """  const runDiagnostic = () => {
    setDiagState('TESTING');
    
    if (isListeningRef.current) {
      setDiagState('PASS');
      setDiagMessageHe('אבחון הושלם בהצלחה! אות שמע זוהה.');
      setDiagMessageEn('Diagnostic successful! Audio signal is being captured.');
    } else {
      setDiagState('FAIL');
      setDiagMessageHe('האבחון נכשל: יש להפעיל את המיקרופון תחילה.');
      setDiagMessageEn('Diagnostic failed: Please start microphone capture first.');
    }
  };""")

with open('src/components/AudioVisualizer.tsx', 'w') as f:
    f.write(content)
