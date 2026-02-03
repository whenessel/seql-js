import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator/generator';

describe('firstName selector generation fix', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should include id="firstName" in semantics', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <div class="glass-card">
          <input
            id="firstName"
            name="firstName"
            class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </form>
    `;

    const firstNameInput = document.querySelector('#firstName') as HTMLInputElement;
    const eid = generateEID(firstNameInput);

    expect(eid).not.toBeNull();
    expect(eid!.target.semantics.id).toBe('firstName');
    expect(eid!.target.semantics.attributes?.name).toBe('firstName');

    // Should not have file: utility classes in semantics
    const classes = eid!.target.semantics.classes || [];
    expect(classes.every((cls) => !cls.startsWith('file:'))).toBe(true);
    expect(classes.every((cls) => !cls.startsWith('placeholder:'))).toBe(true);
  });

  it('should include id="lastName" in semantics', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <div class="glass-card">
          <input
            id="lastName"
            name="lastName"
            class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </form>
    `;

    const lastNameInput = document.querySelector('#lastName') as HTMLInputElement;
    const eid = generateEID(lastNameInput);

    expect(eid).not.toBeNull();
    expect(eid!.target.semantics.id).toBe('lastName');
    expect(eid!.target.semantics.attributes?.name).toBe('lastName');

    // Should not have file: utility classes in semantics
    const classes = eid!.target.semantics.classes || [];
    expect(classes.every((cls) => !cls.startsWith('file:'))).toBe(true);
  });

  it('should generate consistent semantics for firstName and lastName', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <div class="glass-card">
          <input
            id="firstName"
            name="firstName"
            class="flex h-10 w-full file:border-0 file:bg-transparent"
          />
          <input
            id="lastName"
            name="lastName"
            class="flex h-10 w-full file:border-0 file:bg-transparent"
          />
        </div>
      </form>
    `;

    const firstNameInput = document.querySelector('#firstName') as HTMLInputElement;
    const lastNameInput = document.querySelector('#lastName') as HTMLInputElement;

    const firstNameEID = generateEID(firstNameInput);
    const lastNameEID = generateEID(lastNameInput);

    expect(firstNameEID).not.toBeNull();
    expect(lastNameEID).not.toBeNull();

    // Both should have their IDs in semantics
    expect(firstNameEID!.target.semantics.id).toBe('firstName');
    expect(lastNameEID!.target.semantics.id).toBe('lastName');

    // Neither should have file: utility classes in semantics
    const firstNameClasses = firstNameEID!.target.semantics.classes || [];
    const lastNameClasses = lastNameEID!.target.semantics.classes || [];

    expect(firstNameClasses.every((cls) => !cls.startsWith('file:'))).toBe(true);
    expect(lastNameClasses.every((cls) => !cls.startsWith('file:'))).toBe(true);
  });

  it('should filter out all arbitrary pseudo-class variants from semantics', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input
          id="emailAddress"
          name="email"
          class="form-input file:border-0 file:bg-transparent placeholder:text-muted invalid:border-red accept:text-primary"
        />
      </form>
    `;

    const emailInput = document.querySelector('#emailAddress') as HTMLInputElement;
    const eid = generateEID(emailInput);

    expect(eid).not.toBeNull();
    expect(eid!.target.semantics.id).toBe('emailAddress');

    // Should not contain any pseudo-class variants in classes
    const classes = eid!.target.semantics.classes || [];
    expect(classes.every((cls) => !cls.startsWith('file:'))).toBe(true);
    expect(classes.every((cls) => !cls.startsWith('placeholder:'))).toBe(true);
    expect(classes.every((cls) => !cls.startsWith('invalid:'))).toBe(true);
    expect(classes.every((cls) => !cls.startsWith('accept:'))).toBe(true);

    // Should contain semantic class
    expect(classes).toContain('form-input');
  });

  it('should handle multiple camelCase IDs correctly', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="firstName" name="firstName" />
        <input id="lastName" name="lastName" />
        <input id="emailAddress" name="email" />
        <input id="phoneNumber" name="phone" />
        <input id="userProfile" name="profile" />
      </form>
    `;

    const testCases = [
      { id: 'firstName', expectedId: 'firstName' },
      { id: 'lastName', expectedId: 'lastName' },
      { id: 'emailAddress', expectedId: 'emailAddress' },
      { id: 'phoneNumber', expectedId: 'phoneNumber' },
      { id: 'userProfile', expectedId: 'userProfile' },
    ];

    testCases.forEach(({ id, expectedId }) => {
      const input = document.querySelector(`#${id}`) as HTMLInputElement;
      const eid = generateEID(input);

      expect(eid).not.toBeNull();
      expect(eid!.target.semantics.id).toBe(expectedId);
    });
  });

  it('should correctly identify hash-like IDs with both digits and uppercase', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="firstName123A" name="dynamic1" />
        <input id="userIdAb1Cd2Ef" name="dynamic2" />
        <input id="scBdVaJa1" name="dynamic3" />
      </form>
    `;

    const testCases = [{ id: 'firstName123A' }, { id: 'userIdAb1Cd2Ef' }, { id: 'scBdVaJa1' }];

    testCases.forEach(({ id }) => {
      const input = document.querySelector(`#${id}`) as HTMLInputElement;
      const eid = generateEID(input);

      expect(eid).not.toBeNull();
      // These should be marked as dynamic and NOT included in semantics
      expect(eid!.target.semantics.id).toBeUndefined();
    });
  });

  it('should handle edge case: camelCase ID with only uppercase (no digits)', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="scBdVaJaXy" name="test1" />
        <input id="cssABCDEFGH" name="test2" />
      </form>
    `;

    const testCases = [
      { id: 'scBdVaJaXy', expectedId: 'scBdVaJaXy' },
      { id: 'cssABCDEFGH', expectedId: 'cssABCDEFGH' },
    ];

    testCases.forEach(({ id, expectedId }) => {
      const input = document.querySelector(`#${id}`) as HTMLInputElement;
      const eid = generateEID(input);

      expect(eid).not.toBeNull();
      // Has uppercase but no digits - should be treated as stable
      expect(eid!.target.semantics.id).toBe(expectedId);
    });
  });

  it('should handle edge case: hash-like ID with only digits (no uppercase)', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="css1a2b3c4d" name="test1" />
        <input id="sc12345678" name="test2" />
      </form>
    `;

    const testCases = [
      { id: 'css1a2b3c4d', expectedId: 'css1a2b3c4d' },
      { id: 'sc12345678', expectedId: 'sc12345678' },
    ];

    testCases.forEach(({ id, expectedId }) => {
      const input = document.querySelector(`#${id}`) as HTMLInputElement;
      const eid = generateEID(input);

      expect(eid).not.toBeNull();
      // Has digits but no uppercase - should be treated as stable
      expect(eid!.target.semantics.id).toBe(expectedId);
    });
  });
});
