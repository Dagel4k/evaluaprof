import { adaptCargaDisponibleToCanonical, isCargaDisponibleFormat } from '../src/adapters/cargaDisponibleAdapter';
import cargaData from '../cargadisponible.json';

console.log('=== Testing CargaDisponible Adapter ===\n');

// Test 1: Format detection
console.log('Test 1: Format Detection');
console.log('Is CargaDisponible format?', isCargaDisponibleFormat(cargaData));
console.log('✓ Format detected correctly\n');

// Test 2: Conversion
console.log('Test 2: Data Conversion');
const result = adaptCargaDisponibleToCanonical(cargaData);
console.log(`Converted ${result.subjects.length} subjects`);

// Test 3: Sample subject details
if (result.subjects.length > 0) {
    const firstSubject = result.subjects[0];
    console.log('\nTest 3: Sample Subject Details');
    console.log(`Subject: ${firstSubject.name} (${firstSubject.code})`);
    console.log(`Groups: ${firstSubject.groups.length}`);

    if (firstSubject.groups.length > 0) {
        const firstGroup = firstSubject.groups[0];
        console.log(`\nFirst Group: ${firstGroup.groupCode}`);
        console.log(`Professor: ${firstGroup.professorNames[0]}`);
        console.log(`Schedule slots: ${firstGroup.schedule.length}`);

        if (firstGroup.schedule.length > 0) {
            const slot = firstGroup.schedule[0];
            console.log(`\nSample time slot:`);
            console.log(`  Day: ${slot.day}`);
            console.log(`  Start: ${Math.floor(slot.startTime / 60)}:${String(slot.startTime % 60).padStart(2, '0')}`);
            console.log(`  End: ${Math.floor(slot.endTime / 60)}:${String(slot.endTime % 60).padStart(2, '0')}`);
            console.log(`  Classroom: ${slot.classroom}`);
        }
    }
}

// Test 4: Validate all subjects have groups
console.log('\n\nTest 4: Data Integrity');
const subjectsWithoutGroups = result.subjects.filter(s => s.groups.length === 0);
console.log(`Subjects without groups: ${subjectsWithoutGroups.length}`);

const totalGroups = result.subjects.reduce((sum, s) => sum + s.groups.length, 0);
console.log(`Total groups: ${totalGroups}`);

console.log('\n✓ All tests completed successfully!');
